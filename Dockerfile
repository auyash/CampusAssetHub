FROM python:3.11-slim

WORKDIR /app

COPY . /app

EXPOSE 4000

ENV PORT=4000

CMD ["python", "py_backend/server.py"]
