extends CharacterBody2D


# =========================================================
# STATES
# =========================================================

enum State {
	IDLE,
	VIVA,
	CHASE,
	ATTACK,
	DEAD
}


# =========================================================
# ENEMY SETTINGS
# =========================================================

@export var speed: float = 60.0
@export var damage: float = 10.0
@export var attack_cooldown: float = 1.0


# =========================================================
# HEALTH
# =========================================================

@export var max_health: float = 150.0
@export var invincibility_time: float = 0.3

var health: float = 0.0
var is_invincible: bool = false


# =========================================================
# REFERENCES
# =========================================================

@onready var sprite: AnimatedSprite2D = $AnimatedSprite2D
@onready var detection_zone: Area2D = $DetectionZone
@onready var attack_zone: Area2D = $AttackZone
@onready var interaction_prompt: Label = $InteractionPrompt


# =========================================================
# VARIABLES
# =========================================================

var state: State = State.IDLE

var player: Node2D = null

var can_attack: bool = true

var fight_started: bool = false

var is_mota: bool = false

var dialogue_box: Control = null


# =========================================================
# CONVERSATION
# =========================================================

var conversation_step: int = 0
var current_question_index: int = 0
var correct_answers: int = 0
var impress_meter: float = 50.0


# =========================================================
# VIVA QUESTIONS
# =========================================================

var viva_questions: Array = [

	{
		"question": "What does CPU stand for?",
		"answers": [
			{
				"text": "Central Processing Unit",
				"impress": 10,
				"correct": true
			},
			{
				"text": "Computer Personal Unit",
				"impress": -10,
				"correct": false
			},
			{
				"text": "Central Program Utility",
				"impress": 0,
				"correct": false
			}
		]
	},

	{
		"question": "What does RAM stand for?",
		"answers": [
			{
				"text": "Random Access Memory",
				"impress": 10,
				"correct": true
			},
			{
				"text": "Read Access Machine",
				"impress": -10,
				"correct": false
			},
			{
				"text": "Rapid Application Memory",
				"impress": 0,
				"correct": false
			}
		]
	},

	{
		"question": "Which language is used to style web pages?",
		"answers": [
			{
				"text": "CSS",
				"impress": 10,
				"correct": true
			},
			{
				"text": "Python",
				"impress": -10,
				"correct": false
			},
			{
				"text": "SQL",
				"impress": 0,
				"correct": false
			}
		]
	}
]


# =========================================================
# READY
# =========================================================

func _ready() -> void:

	health = max_health

	add_to_group("enemy")

	_remove_old_health_bars()

	_setup_interaction_prompt()

	_find_dialogue_box()

	if sprite:
		sprite.play("idle")
		sprite.flip_h = false

	if detection_zone:

		if not detection_zone.body_entered.is_connected(
			_on_player_spotted
		):

			detection_zone.body_entered.connect(
				_on_player_spotted
			)

		if not detection_zone.body_exited.is_connected(
			_on_player_lost
		):

			detection_zone.body_exited.connect(
				_on_player_lost
			)

	if attack_zone:

		if not attack_zone.body_entered.is_connected(
			_on_attack_range_entered
		):

			attack_zone.body_entered.connect(
				_on_attack_range_entered
			)

		if not attack_zone.body_exited.is_connected(
			_on_attack_range_exited
		):

			attack_zone.body_exited.connect(
				_on_attack_range_exited
			)

	queue_redraw()

	print("================================")
	print("FA: READY")
	print("FA: HEALTH = ", health)
	print("FA: FIGHT STARTED = ", fight_started)
	print("================================")


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
	var bar_y: float = -50.0

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
				0.90,
				0.20,
				0.20,
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
# INTERACTION PROMPT
# =========================================================

func _setup_interaction_prompt() -> void:

	if interaction_prompt == null:
		return

	interaction_prompt.text = "[ E ] Talk"

	interaction_prompt.horizontal_alignment = (
		HORIZONTAL_ALIGNMENT_CENTER
	)

	interaction_prompt.vertical_alignment = (
		VERTICAL_ALIGNMENT_CENTER
	)

	interaction_prompt.add_theme_font_size_override(
		"font_size",
		16
	)

	interaction_prompt.add_theme_color_override(
		"font_color",
		Color(
			0.85,
			0.90,
			0.92,
			1.0
		)
	)

	interaction_prompt.add_theme_color_override(
		"font_shadow_color",
		Color(
			0.0,
			0.0,
			0.0,
			0.8
		)
	)

	interaction_prompt.add_theme_constant_override(
		"shadow_offset_x",
		2
	)

	interaction_prompt.add_theme_constant_override(
		"shadow_offset_y",
		2
	)

	interaction_prompt.position = Vector2(
		-70,
		-55
	)

	interaction_prompt.size = Vector2(
		140,
		30
	)

	interaction_prompt.hide()


# =========================================================
# FIND DIALOGUE BOX
# =========================================================

func _find_dialogue_box() -> void:

	var current_scene := get_tree().current_scene

	if current_scene == null:
		return

	dialogue_box = current_scene.find_child(
		"DialogueBox",
		true,
		false
	) as Control

	if dialogue_box:

		print("FA: DialogueBox FOUND")

		if dialogue_box.has_signal("answer_selected"):

			if not dialogue_box.answer_selected.is_connected(
				_on_answer_selected
			):

				dialogue_box.answer_selected.connect(
					_on_answer_selected
				)

	else:

		push_warning(
			"FA: DialogueBox NOT FOUND"
		)


# =========================================================
# PHYSICS
# =========================================================

func _physics_process(_delta: float) -> void:

	if state == State.DEAD:

		velocity = Vector2.ZERO

		move_and_slide()

		return

	match state:

		State.IDLE:

			velocity = Vector2.ZERO

		State.VIVA:

			velocity = Vector2.ZERO

		State.CHASE:

			_chase_player()

		State.ATTACK:

			velocity = Vector2.ZERO

			_try_attack()

	move_and_slide()

	_update_animation()


# =========================================================
# CHASE PLAYER
# =========================================================

func _chase_player() -> void:

	if not fight_started:

		state = State.IDLE
		velocity = Vector2.ZERO

		return

	if player == null:

		state = State.IDLE
		velocity = Vector2.ZERO

		return

	if not is_instance_valid(player):

		player = null
		state = State.IDLE
		velocity = Vector2.ZERO

		return

	var direction := (
		player.global_position -
		global_position
	).normalized()

	velocity = direction * speed


# =========================================================
# PLAYER SPOTTED
# =========================================================

func _on_player_spotted(body: Node2D) -> void:

	if not body.is_in_group("player"):
		return

	if state == State.DEAD:
		return

	player = body

	if not fight_started:

		state = State.IDLE
		velocity = Vector2.ZERO

		if interaction_prompt:
			interaction_prompt.show()

		print("FA: PLAYER NEARBY")
		print("FA: WAITING FOR E")
		print("FA: NOT ATTACKING")

		return

	if interaction_prompt:
		interaction_prompt.hide()

	state = State.CHASE


# =========================================================
# PLAYER LOST
# =========================================================

func _on_player_lost(body: Node2D) -> void:

	if body != player:
		return

	if state == State.DEAD:
		return

	if not fight_started:

		if interaction_prompt:
			interaction_prompt.hide()

		player = null

		state = State.IDLE

		velocity = Vector2.ZERO

		return

	player = null

	state = State.IDLE

	velocity = Vector2.ZERO


# =========================================================
# ATTACK RANGE ENTERED
# =========================================================

func _on_attack_range_entered(body: Node2D) -> void:

	if not body.is_in_group("player"):
		return

	if state == State.DEAD:
		return

	player = body

	if not fight_started:

		state = State.IDLE
		velocity = Vector2.ZERO

		if interaction_prompt:
			interaction_prompt.show()

		print("FA: PLAYER IN ATTACK RANGE")
		print("FA: BUT FIGHT HAS NOT STARTED")

		return

	if interaction_prompt:
		interaction_prompt.hide()

	state = State.ATTACK

	print("FA: PLAYER IN ATTACK RANGE")
	print("FA: ATTACKING")


# =========================================================
# ATTACK RANGE EXITED
# =========================================================

func _on_attack_range_exited(body: Node2D) -> void:

	if not body.is_in_group("player"):
		return

	if body != player:
		return

	if state == State.DEAD:
		return

	if not fight_started:

		state = State.IDLE

		if interaction_prompt:
			interaction_prompt.show()

		return

	state = State.CHASE


# =========================================================
# FA ATTACK + PLAYER KNOCKBACK
# =========================================================

func _try_attack() -> void:

	if not fight_started:

		state = State.IDLE

		return

	if player == null:

		state = State.IDLE

		return

	if not is_instance_valid(player):

		player = null

		state = State.IDLE

		return

	if not can_attack:
		return

	if not player.has_method("take_damage"):
		return

	can_attack = false

	# ---------------------------------------------------------
	# CALCULATE KNOCKBACK DIRECTION
	# ---------------------------------------------------------

	var knockback_direction := (
		player.global_position -
		global_position
	).normalized()

	# ---------------------------------------------------------
	# DAMAGE + KNOCKBACK
	# ---------------------------------------------------------

	player.take_damage(
		damage,
		knockback_direction,
		250.0
	)

	print(
		"FA: ATTACKED PLAYER FOR ",
		damage
	)

	print(
		"FA: KNOCKBACK DIRECTION = ",
		knockback_direction
	)

	# ---------------------------------------------------------
	# COOLDOWN
	# ---------------------------------------------------------

	await get_tree().create_timer(
		attack_cooldown
	).timeout

	if is_instance_valid(self):

		can_attack = true


# =========================================================
# CAN PLAYER DAMAGE FA?
# =========================================================

func can_be_attacked_by_player() -> bool:

	if not fight_started:
		return false

	if state == State.DEAD:
		return false

	return true


# =========================================================
# START VIVA
# =========================================================

func start_viva() -> void:

	if state == State.DEAD:
		return

	if fight_started:
		return

	if state == State.VIVA:
		return

	if dialogue_box == null:
		_find_dialogue_box()

	if dialogue_box == null:

		push_error(
			"FA: DialogueBox not found!"
		)

		return

	state = State.VIVA

	velocity = Vector2.ZERO

	if interaction_prompt:
		interaction_prompt.hide()

	conversation_step = 1
	current_question_index = 0
	correct_answers = 0
	impress_meter = 50.0

	print("================================")
	print("FA: VIVA STARTED")
	print("================================")

	_show_yes_no()


# =========================================================
# YES / NO
# =========================================================

func _show_yes_no() -> void:

	if dialogue_box == null:
		return

	var answers: Array = [

		{
			"text": "Yes",
			"impress": 1001,
			"correct": true
		},

		{
			"text": "No",
			"impress": 1002,
			"correct": false
		}
	]

	dialogue_box.show_question(
		"You came here for the viva?",
		answers,
		impress_meter
	)


# =========================================================
# ANSWER SELECTED
# =========================================================

func _on_answer_selected(
	impress_value: int
) -> void:

	if state != State.VIVA:
		return

	if conversation_step == 1:

		conversation_step = 2

		_show_next_question()

		return

	if conversation_step == 2:

		_process_basic_answer(
			impress_value
		)

		return

	if conversation_step == 3:

		_process_homework(
			impress_value
		)

		return


# =========================================================
# PROCESS BASIC ANSWER
# =========================================================

func _process_basic_answer(
	impress_value: int
) -> void:

	if current_question_index >= viva_questions.size():
		return

	var question_data: Dictionary = (
		viva_questions[current_question_index]
	)

	var selected_correct := false

	for answer in question_data["answers"]:

		if int(answer["impress"]) == impress_value:

			selected_correct = bool(
				answer["correct"]
			)

			break

	if selected_correct:

		correct_answers += 1

		print("FA: CORRECT ANSWER")

	else:

		print("FA: WRONG ANSWER")

	# Only normal question values affect impress meter.

	impress_meter += impress_value

	impress_meter = clamp(
		impress_meter,
		0.0,
		100.0
	)

	if dialogue_box:

		dialogue_box.update_impress(
			impress_meter
		)

	current_question_index += 1

	_show_next_question()


# =========================================================
# NEXT QUESTION
# =========================================================

func _show_next_question() -> void:

	if current_question_index >= viva_questions.size():

		_show_homework_question()

		return

	if dialogue_box == null:
		return

	var question_data: Dictionary = (
		viva_questions[current_question_index]
	)

	dialogue_box.show_question(
		question_data["question"],
		question_data["answers"],
		impress_meter
	)


# =========================================================
# HOMEWORK QUESTION
# =========================================================

func _show_homework_question() -> void:

	conversation_step = 3

	var answers: Array = [

		{
			"text": "Here is my homework.",
			"impress": 10,
			"correct": true
		},

		{
			"text": "I forgot it.",
			"impress": -10,
			"correct": false
		},

		{
			"text": "What homework?",
			"impress": 0,
			"correct": false
		}
	]

	if dialogue_box:

		dialogue_box.show_question(
			"Okay... now give me your homework.",
			answers,
			impress_meter
		)


# =========================================================
# PROCESS HOMEWORK
# =========================================================

func _process_homework(
	impress_value: int
) -> void:

	impress_meter += impress_value

	impress_meter = clamp(
		impress_meter,
		0.0,
		100.0
	)

	if dialogue_box:

		dialogue_box.update_impress(
			impress_meter
		)

	conversation_step = 4

	_show_hungry_dialogue()


# =========================================================
# HUNGRY DIALOGUE
# =========================================================

func _show_hungry_dialogue() -> void:

	print("FA: HOMEWORK RECEIVED")
	print("FA: VIVA FINISHED")
	print("FA: I'M HUNGRY")

	if dialogue_box:

		if dialogue_box.has_method("show_message"):

			dialogue_box.show_message(
				"Honestly... I'm hungry.\nEnough with this viva!"
			)

	await get_tree().create_timer(
		2.0
	).timeout

	_transform_into_mota()


# =========================================================
# TRANSFORM FA → MOTA
# =========================================================

func _transform_into_mota() -> void:

	if state == State.DEAD:
		return

	print("================================")
	print("FA: TRANSFORMATION STARTED")
	print("================================")

	state = State.VIVA

	velocity = Vector2.ZERO

	if interaction_prompt:
		interaction_prompt.hide()

	if dialogue_box:
		dialogue_box.end_dialogue()

	# ---------------------------------------------------------
	# SHAKE
	# ---------------------------------------------------------

	var original_position := position

	var shake_tween := create_tween()

	shake_tween.tween_property(
		self,
		"position",
		original_position + Vector2(-4, 0),
		0.06
	)

	shake_tween.tween_property(
		self,
		"position",
		original_position + Vector2(4, 0),
		0.06
	)

	shake_tween.tween_property(
		self,
		"position",
		original_position + Vector2(-4, 0),
		0.06
	)

	shake_tween.tween_property(
		self,
		"position",
		original_position + Vector2(4, 0),
		0.06
	)

	shake_tween.tween_property(
		self,
		"position",
		original_position,
		0.06
	)

	await shake_tween.finished

	# ---------------------------------------------------------
	# SWITCH TO MOTA
	# ---------------------------------------------------------

	is_mota = true

	if sprite:

		if sprite.sprite_frames.has_animation("mota"):

			sprite.play("mota")

			# IMPORTANT:
			# Do NOT reset flip_h here.
			# Mota direction is handled by _update_animation().

			print("FA: SWITCHED TO MOTA")

		else:

			push_error(
				"FA: 'mota' animation NOT FOUND!"
			)

	await get_tree().create_timer(
		0.8
	).timeout

	_start_fight()


# =========================================================
# START FIGHT
# =========================================================

func _start_fight() -> void:

	if state == State.DEAD:
		return

	fight_started = true

	conversation_step = 5

	if dialogue_box:
		dialogue_box.end_dialogue()

	if interaction_prompt:
		interaction_prompt.hide()

	print("================================")
	print("FA: FIGHT STARTED")
	print("FA: MOTA IS ACTIVE")
	print("FA: PLAYER CAN DAMAGE MOTA")
	print("FA: MOTA CAN DAMAGE PLAYER")
	print("FA HEALTH = ", health)
	print("================================")

	if player != null:

		var distance := global_position.distance_to(
			player.global_position
		)

		if distance <= 40.0:

			state = State.ATTACK

		else:

			state = State.CHASE

	else:

		state = State.IDLE


# =========================================================
# TAKE DAMAGE
# =========================================================

func take_damage(amount: float) -> void:

	if not fight_started:

		print(
			"FA: DAMAGE BLOCKED - FIGHT NOT STARTED"
		)

		return

	if state == State.DEAD:
		return

	if is_invincible:
		return

	health -= amount

	health = maxf(
		health,
		0.0
	)

	queue_redraw()

	print(
		"FA HEALTH: ",
		health
	)

	# Small hit reaction

	if is_mota:

		if sprite and sprite.sprite_frames.has_animation("mota"):

			sprite.play("mota")

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
		0.5,
		0.5
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
	if state == State.DEAD:
		return

	state = State.DEAD
	fight_started = false
	velocity = Vector2.ZERO
	can_attack = false
	is_invincible = true

	if interaction_prompt:
		interaction_prompt.hide()

	print("================================")
	print("MOTA DEFEATED!")
	print("================================")

	# =========================================================
	# DEATH ANIMATION
	# =========================================================

	if sprite:
		if is_mota and sprite.sprite_frames.has_animation("mota_dead"):
			sprite.play("mota_dead")
		elif sprite.sprite_frames.has_animation("die"):
			sprite.play("die")
		else:
			sprite.stop()

	# Hide health bar
	queue_redraw()

	# Give the death animation time to play
	await get_tree().create_timer(1.0).timeout

	# Hide Mota
	visible = false

	# =========================================================
	# SHOW WIN SCREEN
	# =========================================================

	if is_mota:
		var win_screen = get_tree().current_scene.find_child(
			"WinScreen",
			true,
			false
		)

		if win_screen:
			print("FA: WinScreen FOUND!")

			if win_screen.has_method("show_win_screen"):
				win_screen.show_win_screen()
			else:
				push_error("WinScreen does not have show_win_screen()")
		else:
			push_error("FA: WinScreen NOT FOUND!")

# =========================================================
# ANIMATION
# =========================================================

func _update_animation() -> void:

	if sprite == null:
		return

	if state == State.DEAD:
		return

	if state == State.VIVA:
		return

	# =========================================================
	# MOTA ANIMATION + DIRECTION
	# =========================================================

	if is_mota:

		# Mota sprite faces LEFT by default.
		#
		# Moving RIGHT:
		# flip_h = true
		#
		# Moving LEFT:
		# flip_h = false
		#
		# Only change direction while actually moving.
		# This means attacking will keep the last direction.

		if abs(velocity.x) > 0.1:

			if velocity.x > 0.0:

				sprite.flip_h = true

			else:

				sprite.flip_h = false

		# -----------------------------------------------------
		# MOTA WALK
		# -----------------------------------------------------

		if state == State.CHASE:

			if sprite.sprite_frames.has_animation(
				"mota_walk"
			):

				if sprite.animation != "mota_walk":

					sprite.play("mota_walk")

			elif sprite.sprite_frames.has_animation(
				"mota"
			):

				if sprite.animation != "mota":

					sprite.play("mota")

			return

		# -----------------------------------------------------
		# MOTA ATTACK
		# -----------------------------------------------------

		if state == State.ATTACK:

			if sprite.sprite_frames.has_animation(
				"mota"
			):

				if sprite.animation != "mota":

					sprite.play("mota")

			return

		# -----------------------------------------------------
		# MOTA DEFAULT
		# -----------------------------------------------------

		if sprite.sprite_frames.has_animation(
			"mota"
		):

			if sprite.animation != "mota":

				sprite.play("mota")

		return


	# =========================================================
	# NORMAL FA ANIMATION
	# =========================================================

	if state == State.CHASE:

		_play_animation("walk_up")

		return

	if state == State.ATTACK:

		_play_animation("idle")

		return

	_play_animation("idle")


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
