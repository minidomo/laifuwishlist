<h1 align="center">LaifuWishlist</h1>

## About

LaifuWishlist is a supplementary Discord bot to [LaifuBot](https://laifubot.fandom.com/wiki/Laifubot_Wiki) to enhance the gacha experience!

> DISCLAIMER: This bot is not affiliated with LaifuBot.

## Features

-   Character and series wishlists
-   Unlimited wishlist slots
-   Support for image numbers in character wishlists
-   Wishlist alerts for gacha, view, and burn commands
-   Notifications for medal drops and finished drop cooldowns

## Prequisites

-   [Node.js](https://nodejs.org/en/)
-   [MongoDB](https://www.mongodb.com/)

## Getting started

Clone the repository, install dependencies, and build files.

```sh
git clone https://github.com/minidomo/laifuwishlist.git
cd laifuwishlist
npm install
npm run build
```

Create a `.env` file in the root directory and set environment variables accordingly. See `.env.example`.

Start a MongoDB local instance in a separate terminal.

> This is not needed if you're using something like MongoDB Atlas.

```sh
mongod
```

Deploy commands to your bot.

```sh
npm run deploy:commands -- --prod
```

Start the bot.

```sh
npm run start -- --prod
```
