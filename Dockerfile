FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt /tmp/requirements.txt
RUN pip install --no-cache-dir -r /tmp/requirements.txt

# На Bothost /app монтируется из Git. Код лежит в backend/.
WORKDIR /app/backend
CMD ["python", "main.py"]
