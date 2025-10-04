from flask import Blueprint
from .controllers import get_current_date

date_bp = Blueprint('date', __name__)


@date_bp.route('/now', methods=['GET'])
def now():
	return get_current_date()
