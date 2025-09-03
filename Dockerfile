# Use an official Node runtime as the base image
FROM node:20-alpine

# Set working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the React app
RUN npm run build

# Install a simple server for serving static content
RUN npm install -g serve

# Expose port 8080
EXPOSE 8080

# Serve the build directory
CMD ["serve", "-s", "build", "-l", "8080"]
```

3. Update `app.yaml`:
```yaml
runtime: nodejs20
env: standard
instance_class: F2

handlers:
  - url: /static/(.*)
    static_files: build/static/\1
    upload: build/static/.*
    secure: always

  - url: /(.*\.(json|ico|js|css|png|jpg|jpeg|gif|svg))$
    static_files: build/\1
    upload: build/.*\.(json|ico|js|css|png|jpg|jpeg|gif|svg)$
    secure: always

  - url: /.*
    static_files: build/index.html
    upload: build/index.html
    secure: always

entrypoint: npm start
```
