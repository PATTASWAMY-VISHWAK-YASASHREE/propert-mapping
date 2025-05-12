FROM node:16-alpine

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
RUN npm ci

# Copy app source
COPY . .

# Expose port
EXPOSE 5000

# Start command
CMD ["npm", "run", "dev"]