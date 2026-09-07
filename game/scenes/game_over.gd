extends Control


@onready var restart_button: Button = $Panel/VBoxContainer/RestartButton


func _ready() -> void:

	# Hide game over screen when level starts
	hide()

	# Connect restart button
	if restart_button:
		restart_button.pressed.connect(_on_restart_pressed)


func show_game_over() -> void:

	show()

	# Pause the game
	get_tree().paused = true

	# Make sure the GameOver UI still works while paused
	process_mode = Node.PROCESS_MODE_ALWAYS

	print("GAME OVER SCREEN SHOWN")


func _on_restart_pressed() -> void:

	print("RESTARTING LEVEL")

	# Unpause first
	get_tree().paused = false

	# Reload current scene
	get_tree().reload_current_scene()
