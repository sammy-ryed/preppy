extends Control


# =========================================================
# SIGNALS
# =========================================================

signal answer_selected(impress_value: int)
signal dialogue_finished


# =========================================================
# REFERENCES
# =========================================================

@onready var panel: Panel = $Panel
@onready var question_label: Label = $Panel/Label
@onready var progress_bar: TextureProgressBar = $Panel/TextureProgressBar
@onready var answers_container: VBoxContainer = $Panel/VBoxContainer


# =========================================================
# READY
# =========================================================

func _ready() -> void:

	hide()

	_setup_panel()


# =========================================================
# PANEL STYLE
# =========================================================

func _setup_panel() -> void:

	if panel == null:
		return

	var style := StyleBoxFlat.new()

	style.bg_color = Color(
		0.16,
		0.20,
		0.23,
		0.95
	)

	style.border_color = Color(
		0.40,
		0.46,
		0.50,
		0.9
	)

	style.set_border_width_all(2)

	style.corner_radius_top_left = 12
	style.corner_radius_top_right = 12
	style.corner_radius_bottom_left = 12
	style.corner_radius_bottom_right = 12

	style.shadow_color = Color(
		0.0,
		0.0,
		0.0,
		0.35
	)

	style.shadow_size = 8

	panel.add_theme_stylebox_override(
		"panel",
		style
	)


# =========================================================
# SHOW QUESTION
# =========================================================

func show_question(
	question_text: String,
	answers: Array,
	current_impress: float
) -> void:

	show()

	question_label.text = question_text

	question_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART

	progress_bar.show()

	update_impress(current_impress)

	_clear_answers()

	for answer in answers:

		var button := Button.new()

		button.text = str(answer["text"])

		button.custom_minimum_size = Vector2(
			0,
			42
		)

		button.add_theme_font_size_override(
			"font_size",
			16
		)

		var impress_value := int(
			answer["impress"]
		)

		button.pressed.connect(
			_on_answer_pressed.bind(impress_value)
		)

		answers_container.add_child(button)


# =========================================================
# ANSWER PRESSED
# =========================================================

func _on_answer_pressed(
	impress_value: int
) -> void:

	answer_selected.emit(
		impress_value
	)


# =========================================================
# SHOW MESSAGE
# =========================================================

func show_message(message: String) -> void:

	show()

	question_label.text = message

	question_label.autowrap_mode = (
		TextServer.AUTOWRAP_WORD_SMART
	)

	progress_bar.hide()

	_clear_answers()


# =========================================================
# UPDATE IMPRESSION
# =========================================================

func update_impress(value: float) -> void:

	if progress_bar == null:
		return

	progress_bar.min_value = 0.0
	progress_bar.max_value = 100.0

	progress_bar.value = clamp(
		value,
		0.0,
		100.0
	)


# =========================================================
# CLEAR ANSWERS
# =========================================================

func _clear_answers() -> void:

	for child in answers_container.get_children():

		child.queue_free()


# =========================================================
# END DIALOGUE
# =========================================================

func end_dialogue() -> void:

	hide()

	_clear_answers()

	dialogue_finished.emit()
