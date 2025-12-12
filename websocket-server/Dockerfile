FROM node:20-slim

WORKDIR /app

COPY package.json ./
RUN npm install --production

COPY index.mjs ./

ENV NODE_ENV=production
ENV PORT=10000

EXPOSE 10000

CMD ["node", "index.mjs"]
