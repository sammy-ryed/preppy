extends Control


@onready var restart_button: Button = $Panel/VBoxContainer/RestartButton


func _ready() -> void:
	hide()

	process_mode = Node.PROCESS_MODE_ALWAYS

	if restart_button:
		restart_button.pressed.connect(_on_restart_pressed)


func show_win_screen() -> void:
	show()

	get_tree().paused = true

	print("================================")
	print("YOU WIN SCREEN SHOWN")
	print("================================")


func _on_restart_pressed() -> void:
	print("RESTARTING GAME")

	get_tree().paused = false

	get_tree().reload_current_scene()
