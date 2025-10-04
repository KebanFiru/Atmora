from app import create_app


def main():
    app = create_app()
    # Development server - do not use this in production
    app.run(host='127.0.0.1', port=5000, debug=True)


if __name__ == '__main__':
    main()
