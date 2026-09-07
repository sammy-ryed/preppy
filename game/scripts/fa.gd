extends CharacterBody2D

enum State { IDLE, CHASE, ATTACK, VIVA, PASSIVE }

@export var speed: float = 60.0
@export var damage: float = 10.0
@export var attack_cooldown: float = 1.0

@onready var sprite: AnimatedSprite2D = $AnimatedSprite2D
@onready var detection_zone: Area2D = $DetectionZone
@onready var attack_zone: Area2D = $AttackZone

var state: State = State.IDLE
var player: Node2D = null
var can_attack: bool = true
var dialogue_box: Control = null

var viva_questions: Array = [
	{
		"question": "Why should I let you through?",
		"answers": [
			{"text": "I have urgent business here.", "impress": 15},
			{"text": "None of your concern.", "impress": -20},
			{"text": "Please, I mean no harm.", "impress": 5}
		]
	},
	{
		"question": "Who sent you?",
		"answers": [
			{"text": "No one, I came on my own.", "impress": 10},
			{"text": "That's classified.", "impress": -10},
			{"text": "I'd rather not say.", "impress": -5}
		]
	},
	{
		"question": "What's in your bag?",
		"answers": [
			{"text": "Just supplies.", "impress": 10},
			{"text": "That's private.", "impress": -15},
			{"text": "Nothing important.", "impress": 0}
		]
	}
]

var impress_meter: float = 50.0
var current_question_index: int = 0
var has_had_viva: bool = false

func _ready() -> void:
	detection_zone.body_entered.connect(_on_player_spotted)
	detection_zone.body_exited.connect(_on_player_lost)
	attack_zone.body_entered.connect(_on_attack_range_entered)
	attack_zone.body_exited.connect(_on_attack_range_exited)

	# Find the DialogueBox in the scene tree (safe if not set up yet)
	dialogue_box = get_tree().root.get_node_or_null("Main/DialogueBox")
	if dialogue_box:
		dialogue_box.answer_selected.connect(_on_answer_selected)

func _physics_process(_delta: float) -> void:
	match state:
		State.IDLE:
			velocity = Vector2.ZERO
		State.CHASE:
			if player:
				var dir = (player.global_position - global_position).normalized()
				velocity = dir * speed
			else:
				state = State.IDLE
		State.ATTACK:
			velocity = Vector2.ZERO
			_try_attack()
		State.VIVA, State.PASSIVE:
			velocity = Vector2.ZERO

	move_and_slide()
	_update_animation()

func _on_player_spotted(body: Node2D) -> void:
	print("Detection zone hit: ", body.name)
	if body.is_in_group("player"):
		print("Player spotted - chasing!")
		player = body
		state = State.CHASE

func _on_player_lost(body: Node2D) -> void:
	if body == player and state != State.VIVA:
		player = null
		state = State.IDLE

func _on_attack_range_entered(body: Node2D) -> void:
	if body.is_in_group("player") and state == State.CHASE:
		state = State.ATTACK

func _on_attack_range_exited(body: Node2D) -> void:
	if body.is_in_group("player") and player and state == State.ATTACK:
		state = State.CHASE

func _try_attack() -> void:
	if can_attack and player and player.has_method("take_damage"):
		player.take_damage(damage)
		can_attack = false
		await get_tree().create_timer(attack_cooldown).timeout
		can_attack = true

func start_viva() -> void:
	if has_had_viva or state == State.VIVA:
		return
	if not dialogue_box:
		state = State.CHASE
		return
	state = State.VIVA
	velocity = Vector2.ZERO
	current_question_index = 0
	impress_meter = 50.0
	_show_next_question()

func _show_next_question() -> void:
	if current_question_index >= viva_questions.size():
		_end_viva()
		return
	var q = viva_questions[current_question_index]
	dialogue_box.show_question(q["question"], q["answers"], impress_meter)

func _on_answer_selected(impress_value: int) -> void:
	if state != State.VIVA:
		return
	impress_meter = clamp(impress_meter + impress_value, 0, 100)
	dialogue_box.update_impress(impress_meter)
	current_question_index += 1
	_show_next_question()

func _end_viva() -> void:
	dialogue_box.end_dialogue()
	has_had_viva = true
	if impress_meter < 50.0:
		state = State.CHASE
	else:
		state = State.PASSIVE

func _update_animation() -> void:
	if velocity.length() < 5.0:
		sprite.play("idle")
		return
	if abs(velocity.y) > abs(velocity.x):
		sprite.play("walk_up")
	else:
		sprite.play("walk_Left_Right")
		sprite.flip_h = velocity.x < 0
