FROM ubuntu:24.04

# Install necessary packages
RUN apt-get update && apt-get install -y \
    curl \
    git \
    nodejs \
    npm \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Set the working directory
WORKDIR /workspace

# Copy the project files into the container
COPY . .

# Install project dependencies
RUN npm install

# Command to run the application
CMD ["node", "src/main.ts"]