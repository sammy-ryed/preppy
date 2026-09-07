extends CharacterBody2D


# =========================================================
# PLAYER SETTINGS
# =========================================================

@export var speed: float = 100.0

@export var max_health: float = 100.0

@export var attack_damage: float = 15.0
@export var attack_cooldown: float = 0.5
@export var attack_range: float = 80.0
@export var attack_duration: float = 0.3

@export var invincibility_time: float = 0.5

@export var interact_range: float = 60.0

@export var respawn_time: float = 2.0


# =========================================================
# KNOCKBACK SETTINGS
# =========================================================

@export var knockback_force: float = 250.0
@export var knockback_duration: float = 0.35


# =========================================================
# REFERENCES
# =========================================================

@onready var sprite: AnimatedSprite2D = $AnimatedSprite2D


# =========================================================
# VARIABLES
# =========================================================

var health: float = 0.0

var can_attack: bool = true
var is_attacking: bool = false
var is_dead: bool = false
var is_invincible: bool = false

var last_direction: Vector2 = Vector2.DOWN
var spawn_position: Vector2

# Knockback
var is_knocked_back: bool = false
var knockback_velocity: Vector2 = Vector2.ZERO
var knockback_timer: float = 0.0


# =========================================================
# READY
# =========================================================

func _ready() -> void:

	health = max_health
	spawn_position = global_position

	add_to_group("player")

	_remove_old_health_bars()

	queue_redraw()

	_play_animation("idle")

	print("PLAYER: Ready")
	print("PLAYER: Health = ", health)


# =========================================================
# REMOVE OLD HEALTH BARS
# =========================================================

func _remove_old_health_bars() -> void:

	for child in get_children():

		if child is ProgressBar:

			child.queue_free()


# =========================================================
# HEALTH BAR
# =========================================================

func _draw() -> void:

	var bar_width: float = 40.0
	var bar_height: float = 5.0

	var bar_x: float = -bar_width / 2.0
	var bar_y: float = -42.0

	var health_ratio: float = 0.0

	if max_health > 0.0:

		health_ratio = clamp(
			health / max_health,
			0.0,
			1.0
		)

	# Background

	draw_rect(
		Rect2(
			bar_x,
			bar_y,
			bar_width,
			bar_height
		),
		Color(
			0.05,
			0.05,
			0.05,
			0.95
		),
		true
	)

	# Health

	if health_ratio > 0.0:

		draw_rect(
			Rect2(
				bar_x,
				bar_y,
				bar_width * health_ratio,
				bar_height
			),
			Color(
				0.20,
				0.85,
				0.30,
				1.0
			),
			true
		)

	# Border

	draw_rect(
		Rect2(
			bar_x,
			bar_y,
			bar_width,
			bar_height
		),
		Color(
			0.80,
			0.80,
			0.80,
			0.80
		),
		false,
		1.0
	)


# =========================================================
# PHYSICS
# =========================================================

func _physics_process(delta: float) -> void:

	if is_dead:

		velocity = Vector2.ZERO

		move_and_slide()

		return


	# =====================================================
	# KNOCKBACK
	# =====================================================

	if is_knocked_back:

		knockback_timer -= delta

		velocity = knockback_velocity

		# Gradually slow the player

		knockback_velocity = knockback_velocity.move_toward(
			Vector2.ZERO,
			1200.0 * delta
		)

		move_and_slide()

		if knockback_timer <= 0.0:

			is_knocked_back = false
			knockback_velocity = Vector2.ZERO
			velocity = Vector2.ZERO

		return


	# =====================================================
	# ATTACKING
	# =====================================================

	if is_attacking:

		velocity = Vector2.ZERO

		move_and_slide()

		return


	_handle_movement()

	_handle_attack_input()

	move_and_slide()

	_update_animation()


# =========================================================
# INPUT
# =========================================================

func _unhandled_input(event: InputEvent) -> void:

	if is_dead:
		return

	if event.is_action_pressed("interact"):

		print("PLAYER: E PRESSED")

		_try_interact()


# =========================================================
# MOVEMENT
# =========================================================

func _handle_movement() -> void:

	var input_dir := Vector2.ZERO

	input_dir.x = (
		Input.get_action_strength("move_right")
		-
		Input.get_action_strength("move_left")
	)

	input_dir.y = (
		Input.get_action_strength("move_down")
		-
		Input.get_action_strength("move_up")
	)

	input_dir = input_dir.normalized()

	velocity = input_dir * speed

	if input_dir != Vector2.ZERO:

		last_direction = input_dir


# =========================================================
# ATTACK INPUT
# =========================================================

func _handle_attack_input() -> void:

	if Input.is_action_just_pressed("attack"):

		if can_attack:

			_attack()


# =========================================================
# ATTACK
# =========================================================

func _attack() -> void:

	is_attacking = true
	can_attack = false

	_update_attack_direction()

	_play_animation("shot")

	print("PLAYER: ATTACK!")

	_damage_enemy()

	await get_tree().create_timer(
		attack_duration
	).timeout

	is_attacking = false

	var remaining_cooldown := maxf(
		attack_cooldown - attack_duration,
		0.0
	)

	if remaining_cooldown > 0.0:

		await get_tree().create_timer(
			remaining_cooldown
		).timeout

	can_attack = true


# =========================================================
# ATTACK DIRECTION
# =========================================================

func _update_attack_direction() -> void:

	if sprite == null:
		return

	if abs(last_direction.x) > abs(last_direction.y):

		if last_direction.x < 0:

			sprite.flip_h = true

		else:

			sprite.flip_h = false


# =========================================================
# DAMAGE ENEMY
# =========================================================

func _damage_enemy() -> void:

	var enemies := get_tree().get_nodes_in_group("enemy")

	var closest_enemy: Node2D = null
	var closest_distance: float = attack_range

	for enemy in enemies:

		if not is_instance_valid(enemy):
			continue

		if not enemy is Node2D:
			continue

		if enemy.has_method("can_be_attacked_by_player"):

			if not enemy.can_be_attacked_by_player():

				continue

		var distance := global_position.distance_to(
			enemy.global_position
		)

		if distance <= closest_distance:

			closest_distance = distance
			closest_enemy = enemy


	if closest_enemy == null:

		print("PLAYER: Attack missed.")

		return


	print(
		"PLAYER: ATTACK HIT -> ",
		closest_enemy.name
	)

	print(
		"PLAYER: Distance = ",
		closest_distance
	)


	if closest_enemy.has_method("take_damage"):

		closest_enemy.take_damage(
			attack_damage
		)

		print(
			"PLAYER: DEALT ",
			attack_damage,
			" DAMAGE TO ",
			closest_enemy.name
		)


# =========================================================
# INTERACTION
# =========================================================

func _try_interact() -> void:

	var enemies := get_tree().get_nodes_in_group("enemy")

	var closest_enemy: Node2D = null
	var closest_distance: float = interact_range

	for enemy in enemies:

		if not is_instance_valid(enemy):
			continue

		if not enemy is Node2D:
			continue

		var distance := global_position.distance_to(
			enemy.global_position
		)

		if distance <= closest_distance:

			closest_distance = distance
			closest_enemy = enemy


	if closest_enemy == null:

		print("PLAYER: No NPC close enough.")

		return


	print(
		"PLAYER: Interacting with ",
		closest_enemy.name
	)


	if closest_enemy.has_method("start_viva"):

		closest_enemy.start_viva()


# =========================================================
# TAKE DAMAGE + KNOCKBACK
# =========================================================

func take_damage(
	amount: float,
	hit_direction: Vector2 = Vector2.ZERO,
	hit_force: float = -1.0
) -> void:

	if is_dead:
		return

	if is_invincible:
		return


	# =====================================================
	# HEALTH
	# =====================================================

	health -= amount

	health = maxf(
		health,
		0.0
	)

	queue_redraw()

	print(
		"PLAYER HEALTH: ",
		health
	)


	# =====================================================
	# KNOCKBACK
	# =====================================================

	if hit_direction != Vector2.ZERO:

		is_knocked_back = true

		knockback_timer = knockback_duration

		var final_force := knockback_force

		if hit_force > 0.0:

			final_force = hit_force

		knockback_velocity = (
			hit_direction.normalized()
			* final_force
		)

		print(
			"PLAYER: KNOCKBACK -> ",
			knockback_velocity
		)


	# =====================================================
	# DEATH
	# =====================================================

	if health <= 0.0:

		die()

		return


	_start_invincibility()


# =========================================================
# INVINCIBILITY
# =========================================================

func _start_invincibility() -> void:

	is_invincible = true

	modulate = Color(
		1.0,
		0.4,
		0.4
	)

	await get_tree().create_timer(
		invincibility_time
	).timeout

	if is_instance_valid(self):

		modulate = Color.WHITE

		is_invincible = false


# =========================================================
# DEATH
# =========================================================

func die() -> void:

	if is_dead:
		return

	is_dead = true

	velocity = Vector2.ZERO

	print("PLAYER DIED")

	# Find GameOver UI
	var game_over = get_tree().current_scene.find_child(
		"GameOver",
		true,
		false
	)

	if game_over:

		if game_over.has_method("show_game_over"):

			game_over.show_game_over()


# =========================================================
# RESPAWN
# =========================================================

func respawn() -> void:

	health = max_health

	global_position = spawn_position

	velocity = Vector2.ZERO

	knockback_velocity = Vector2.ZERO
	knockback_timer = 0.0

	is_dead = false
	is_invincible = false
	is_knocked_back = false

	visible = true

	modulate = Color.WHITE

	queue_redraw()

	_play_animation("idle")

	print("PLAYER: RESPAWNED")


# =========================================================
# ANIMATION
# =========================================================

func _update_animation() -> void:

	if sprite == null:
		return

	if is_attacking:
		return

	if is_knocked_back:
		return

	if velocity.length() < 5.0:

		_play_animation("idle")

		return


	if abs(velocity.y) > abs(velocity.x):

		if velocity.y < 0:

			_play_animation("walk_up")

		else:

			_play_animation("walk")

		return


	if velocity.x > 0:

		_play_animation("walk_left_right")

		sprite.flip_h = false

		return


	_play_animation("walk_left_right")

	sprite.flip_h = true


# =========================================================
# SAFE ANIMATION
# =========================================================

func _play_animation(animation_name: String) -> void:

	if sprite == null:
		return

	if sprite.sprite_frames == null:
		return

	if not sprite.sprite_frames.has_animation(
		animation_name
	):

		return

	if sprite.animation != animation_name:

		sprite.play(animation_name)
