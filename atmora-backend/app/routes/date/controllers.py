from flask import jsonify
from datetime import datetime


def get_current_date():
	now = datetime.utcnow().isoformat() + 'Z'
	return jsonify({'now': now})
