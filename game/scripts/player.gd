extends CharacterBody2D

@export var speed: float = 100.0
@export var max_health: float = 100.0
@export var attack_damage: float = 15.0
@export var attack_cooldown: float = 0.5
@export var attack_range: float = 20.0
@export var invincibility_time: float = 0.5
@export var interact_range: float = 40.0
@export var respawn_time: float = 2.0

@onready var sprite: AnimatedSprite2D = $AnimatedSprite2D

var health: float
var can_attack: bool = true
var last_direction: Vector2 = Vector2.DOWN
var is_attacking: bool = false
var is_dead: bool = false
var is_invincible: bool = false
var spawn_position: Vector2

func _ready() -> void:
	health = max_health
	spawn_position = global_position
	add_to_group("player")

func _physics_process(_delta: float) -> void:
	if is_dead:
		velocity = Vector2.ZERO
		move_and_slide()
		return

	if is_attacking:
		velocity = Vector2.ZERO
		move_and_slide()
		return

	_handle_movement()
	_handle_attack_input()
	move_and_slide()
	_update_animation()

func _unhandled_input(event: InputEvent) -> void:
	if is_dead:
		return
	if event.is_action_pressed("interact"):
		_try_interact()

func _try_interact() -> void:
	var fa_nodes = get_tree().get_nodes_in_group("enemy")
	for fa in fa_nodes:
		if global_position.distance_to(fa.global_position) <= interact_range:
			if fa.has_method("start_viva"):
				fa.start_viva()
			break

func _handle_movement() -> void:
	var input_dir = Vector2.ZERO
	input_dir.x = Input.get_action_strength("ui_right") - Input.get_action_strength("ui_left")
	input_dir.y = Input.get_action_strength("ui_down") - Input.get_action_strength("ui_up")
	input_dir = input_dir.normalized()

	velocity = input_dir * speed

	if input_dir != Vector2.ZERO:
		last_direction = input_dir

func _handle_attack_input() -> void:
	if Input.is_action_just_pressed("ui_accept") and can_attack:
		_attack()

func _attack() -> void:
	is_attacking = true
	can_attack = false
	sprite.play("idle")

	var space_state = get_world_2d().direct_space_state
	var query = PhysicsRayQueryParameters2D.create(
		global_position,
		global_position + last_direction * attack_range
	)
	query.collide_with_areas = false
	query.collide_with_bodies = true
	var result = space_state.intersect_ray(query)

	if result and result.collider.is_in_group("enemy"):
		if result.collider.has_method("take_damage"):
			result.collider.take_damage(attack_damage)

	await get_tree().create_timer(0.3).timeout
	is_attacking = false
	await get_tree().create_timer(attack_cooldown - 0.3).timeout
	can_attack = true

func take_damage(amount: float) -> void:
	if is_dead or is_invincible:
		return
	health -= amount
	health = max(health, 0)
	print("Player health: ", health)
	if health <= 0:
		die()
	else:
		is_invincible = true
		modulate = Color(1, 0.4, 0.4)   # quick red flash while invincible
		await get_tree().create_timer(invincibility_time).timeout
		modulate = Color(1, 1, 1)
		is_invincible = false

func die() -> void:
	if is_dead:
		return
	is_dead = true
	visible = false
	print("Player died")
	await get_tree().create_timer(respawn_time).timeout
	respawn()

func respawn() -> void:
	health = max_health
	global_position = spawn_position
	is_dead = false
	is_invincible = false
	visible = true
	modulate = Color(1, 1, 1)
	print("Player respawned")

func _update_animation() -> void:
	if is_attacking:
		return
	if velocity.length() < 5.0:
		sprite.play("idle")
		return
	if abs(velocity.y) > abs(velocity.x):
		sprite.play("walk_up")
	else:
		sprite.play("walk_left_right")
		sprite.flip_h = velocity.x < 0
