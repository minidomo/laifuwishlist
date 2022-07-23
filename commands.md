# Commands

## `help`

Shows information about the bot and provides a link to this document.

## `history show`

View your gacha history.

**Arguments**

-   `type` (Required) - Type of gacha.
-   `filter` (Optional) - Filters to apply.
-   `sort` (Optional) - Sort the viewed list.

**Filter Flags**

-   `-24hours` - Show results from last 24 hours.
-   `-7days` - Show results from last 7 days.
-   `-seq <sequence>` - Show characters from the given sequence.
    -   Examples
        -   `-seq kpop` - Show characters with the sequence `K-POP`.
-   `-name <name>` - Show characters/badges that contain the given name.
-   `-series <name>` - Show characters from the given series.
-   `-rarity <rarity>` - Show characters/badges with the given rarity.
    -   Examples
        -   `-rarity tier 2` - Show badges with the tier 2 rarity.
        -   `-rarity zeta` - Show characters with the zeta rarity.
-   `-rarity-lt <rarity>` - Show characters/badges with the a rarity that is less than or equal to the given rarity.
    -   Examples
        -   `-rarity-lt tier 2` - Show badges with the tier 2 rarity or less.
        -   `-rarity-lt zeta` - Show characters with the zeta rarity or less.
-   `-rarity-gt <rarity>` - Show characters/badges with the a rarity that is greater than or equal to the given rarity.
    -   Examples
        -   `-rarity-gt tier 2` - Show badges with the tier 2 rarity or greater.
        -   `-rarity-gt zeta` - Show characters with the zeta rarity or greater.
-   `inf-lt <influence>` - Show characters with the given influence or less.
-   `inf-gt <influence>` - Show characters with the given influence or greater.

## `history stat`

Show statistics of a user's gachas.

**Arguments**

-   `filter` (Optional) - Filter the data to get statistics of.

## `history toggle`

Enable or disable tracking a user's gacha history.

## `missing`

Shows the global IDs that are missing in the database up to the given global ID.

**Arguments**

-   `max_global_id` (Required) - The largets global ID to consider.

## `modify`

Add or remove characters or series to your wishlist. Enter the command and a modal will pop up for the user to enter information.

**Arguments**

-   `action` (Required) - Action to take.
-   `category` (Required) - The category to display.

**Character Input**

Global IDs must be entered on a separate line and optionally followed by the image numbers the user wants. By default all image numbers will be added/removed.

The bot will check each line beginning with a number and consider it as a global ID. Therefore, copying the text from your wishlist in LaifuBot and pasting it in this bot will add or remove characters.

**Series Input**

Series IDs can be entered separated by a space or a line.

The bot will look at all consecutive digits and parse them into a number. This number will be considered as a series ID and be added/removed into the user's wishlist.

## `ping`

Replies with pong.

## `query`

Query the database to view information about the given argument.

**Arguments**

-   `global_id` (Optional) - Global ID of a character.

## `reminder`

Receive pings from the bot regarding LaifuBot. Includes pings about drops and medals.

**Arguments**

-   `type` (Required) - Type of reminder.
-   `toggle` (Required) - Toggle the reminder on or off.

## `wishlist`

View your wishlist (default) or another user's wishlist to see the series or character they want to collect.

**Arguments**

-   `category` (Required) - The category to display.
