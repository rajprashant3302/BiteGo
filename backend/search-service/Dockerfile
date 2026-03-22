FROM python:3.10

WORKDIR /app

COPY . .

# Install Node.js (required for npx prisma)
RUN apt-get update && \
    apt-get install -y nodejs npm

# Install Python dependencies
RUN pip install -r backend/search-service/requirements.txt

# Generate Prisma Python client
RUN cd packages/database && \
    npx prisma@5.17.0 generate --generator py_client --schema=./prisma/schema.prisma

EXPOSE 8001

CMD ["python", "backend/search-service/main.py"]