from flask import Blueprint, request
from .controllers import get_location_info

location_bp = Blueprint('location', __name__)


@location_bp.route('/info', methods=['GET'])
def info():
	# optional query param: lat,lng
	lat = request.args.get('lat')
	lng = request.args.get('lng')
	return get_location_info(lat, lng)
