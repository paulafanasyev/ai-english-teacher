# AI English Teacher API — production image
FROM node:20-alpine AS base

# tini for proper signal handling / zombie reaping as PID 1 (optional but
# good practice); openssl is required by Prisma's engine on alpine.
RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

# Install dependencies first (better layer caching).
COPY package.json package-lock.json* ./
COPY prisma ./prisma

RUN npm ci --omit=dev && npm cache clean --force

# Generate the Prisma client against the schema baked into the image.
RUN npx prisma generate

# Copy the rest of the application source.
COPY src ./src

# Create a non-root user to run the application.
RUN addgroup -S nodeapp && adduser -S nodeapp -G nodeapp \
  && chown -R nodeapp:nodeapp /app

USER nodeapp

ENV NODE_ENV=production
EXPOSE 4000

CMD ["npm", "start"]
