extends Control


@onready var restart_button: Button = $Panel/VBoxContainer/RestartButton


func _ready() -> void:
	hide()

	process_mode = Node.PROCESS_MODE_ALWAYS

	if restart_button:
		restart_button.pressed.connect(_on_restart_pressed)
	_send_preppy_event("GAME_READY")


func show_win_screen() -> void:
	show()
	_send_preppy_event("GAME_COMPLETE")

	get_tree().paused = true

	print("================================")
	print("YOU WIN SCREEN SHOWN")
	print("================================")


func _on_restart_pressed() -> void:
	print("RESTARTING GAME")

	get_tree().paused = false

	get_tree().reload_current_scene()


# Native PREPPY bridge only; standalone Godot/browser play is unchanged.
func _send_preppy_event(event_type: String) -> void:
	if not OS.has_feature("web"):
		return
	var bridge = JavaScriptBridge.get_interface("ReactNativeWebView")
	if bridge == null:
		return
	var raw = JavaScriptBridge.eval("JSON.stringify(Object.fromEntries(new URLSearchParams(window.location.search)))", true)
	var launch = JSON.parse_string(str(raw))
	if not launch is Dictionary or launch.get("bridgeVersion") != "1":
		return
	if not launch.get("stage", "") in ["break1", "break2", "finalBoss"] or launch.get("sessionId", "").is_empty():
		return
	var payload = {"bridgeVersion": 1, "type": event_type, "sessionId": launch["sessionId"], "stage": launch["stage"]}
	if event_type == "GAME_COMPLETE":
		payload["completed"] = true
		payload["score"] = 0
		payload["coins"] = 0
	bridge.postMessage(JSON.stringify(payload))
