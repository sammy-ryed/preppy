extends Control

signal answer_selected(impress_value: int)
signal dialogue_finished

@onready var question_label: Label = $Panel/Label
@onready var impress_bar: TextureProgressBar = $Panel/TextureProgressBar
@onready var answers_container: VBoxContainer = $Panel/VBoxContainer

func _ready() -> void:
	visible = false

func show_question(question_text: String, answers: Array, current_impress: float) -> void:
	visible = true
	question_label.text = question_text
	impress_bar.value = current_impress

	for child in answers_container.get_children():
		child.queue_free()

	for answer in answers:
		var btn = Button.new()
		btn.text = answer["text"]
		btn.pressed.connect(_on_answer_pressed.bind(answer["impress"]))
		answers_container.add_child(btn)

func _on_answer_pressed(impress_value: int) -> void:
	answer_selected.emit(impress_value)

func update_impress(value: float) -> void:
	impress_bar.value = value

func end_dialogue() -> void:
	visible = false
	dialogue_finished.emit()
