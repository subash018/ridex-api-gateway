# Use official Node.js runtime as the base image
FROM node:20-alpine

# Set working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json into the working directory
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy the rest of the application code
COPY . .

# Expose the port your app will run on
EXPOSE 8000

# Set environment to production
ENV NODE_ENV=production

# Define the command to run your app
CMD ["node", "ridex_server.js"]

