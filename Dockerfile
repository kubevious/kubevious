###############################################################################
# Step 1 : Builder image
FROM node:12-alpine
WORKDIR /app
COPY src/package*.json ./
RUN npm install --production

###############################################################################
# Step 2 : Runner image
FROM node:12-alpine
WORKDIR /app
COPY --from=0 /app .
COPY src/ ./
CMD [ "node", "." ]
