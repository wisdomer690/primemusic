const client = require("./main");
const { Riffy } = require("riffy");
const { EmbedBuilder } = require('discord.js');
const fs = require("fs");
const { Classic } = require("musicard");
const { prefix } = require('./config.json');
const nodes = [
    {
        host: "new-york-node-1.vortexcloud.xyz",
        port: 5008, 
        password: "avinan", 
        secure: false
    },
];

client.riffy = new Riffy(client, nodes, {
    send: (payload) => {
        const guild = client.guilds.cache.get(payload.d.guild_id);
        if (guild) guild.shard.send(payload);
    },
    defaultSearchPlatform: "ytmsearch",
    restVersion: "v4" 
});

client.on("ready", () => {
    client.riffy.init(client.user.id);
});

client.on("messageCreate", async (message) => {
    if (!message.content.startsWith(prefix) || message.author.bot) return;

    // تحقق من أن العضو يملك أحد الرولات المحددة
    const requiredRoles = ['1201907918845526046', '1339561600285147226'];
    const member = message.guild.members.cache.get(message.author.id);

    if (!member || !member.roles.cache.some(role => requiredRoles.includes(role.id))) {
        return message.reply("  ** Only for Wisdom boosters and supporters** <a:Booster:1360832375973609693> **try boosting the server to get acces to this command** <a:diamonda:1360835764807536702> ");
    }

    const args = message.content.slice(1).trim().split(" ");
    const command = args.shift().toLowerCase();

    if (command === "play") {
        const query = args.join(" ");
        const player = client.riffy.createConnection({
            guildId: message.guild.id,
            voiceChannel: message.member.voice.channel.id,
            textChannel: message.channel.id,
            deaf: true 
        });

        const resolve = await client.riffy.resolve({ query: query, requester: message.author });
        const { loadType, tracks, playlistInfo } = resolve;

        if (loadType === 'playlist') {
            for (const track of resolve.tracks) {
                track.info.requester = message.author;
                player.queue.add(track);
            }
            const embed = new EmbedBuilder()
                .setAuthor({
                    name: 'Added To Queue',
                    iconURL: 'https://cdn.discordapp.com/attachments/1156866389819281418/1157218651179597884/1213-verified.gif?ex=6517cf5a&is=65167dda&hm=cf7bc8fb4414cb412587ade0af285b77569d2568214d6baab8702ddeb6c38ad5&', 
                    url: 'https://discord.gg/xQF9f9yUEM'
                })
                .setDescription(`**Playlist Name : **${playlistInfo.name} \n**Tracks : **${tracks.length}`)
                .setColor('#14bdff')
                .setFooter({ text: 'Use queue command for more Information' });
            message.reply({ embeds: [embed] });
            if (!player.playing && !player.paused) return player.play();

        } else if (loadType === 'search' || loadType === 'track') {
            const track = tracks.shift();
            track.info.requester = message.author;
            player.queue.add(track);

            const embed = new EmbedBuilder()
                .setAuthor({
                    name: 'Added To Queue',
                    iconURL: 'https://cdn.discordapp.com/attachments/1156866389819281418/1157218651179597884/1213-verified.gif?ex=6517cf5a&is=65167dda&hm=cf7bc8fb4414cb412587ade0af285b77569d2568214d6baab8702ddeb6c38ad5&', 
                    url: 'https://discord.gg/xQF9f9yUEM'
                })
                .setDescription(`**${track.info.title} **has been queued up and is ready to play!`)
                .setColor('#14bdff')
                .setFooter({ text: 'Use queue command for more Information' });
            message.reply({ embeds: [embed] });

            if (!player.playing && !player.paused) return player.play();
        } else {
            return message.channel.send('There are no results found.');
        }
    } else if (command === "loop") {
        const player = client.riffy.players.get(message.guild.id); 
        if (!player) return message.channel.send("No player available.");

        const loopOption = args[0];
        if (!loopOption) return message.channel.send("Please provide a loop option: **queue**, **track**, or **none**.");

        if (loopOption === "queue" || loopOption === "track" || loopOption === "none") {
            player.setLoop(loopOption);
            message.channel.send(`Loop set to: ${loopOption}`);
        } else {
            message.channel.send("Invalid loop option. Please choose `queue`, `track`, or `none`.");
        }
    } else if (command === "pause") {
        const player = client.riffy.players.get(message.guild.id); 
        if (!player) return message.channel.send("No player available.");

        player.pause(true);
        const embed = new EmbedBuilder()
            .setAuthor({
                name: 'Playback Paused!',
                iconURL: 'https://cdn.discordapp.com/attachments/1175488636033175602/1175488720519049337/pause.png?ex=656b6a2e&is=6558f52e&hm=6695d8141e37330b5426f146ec6705243f497f95f08916a40c1db582c6e07d7e&',
                url: 'https://discord.gg/AW2ppwDVts'
            })
            .setDescription('**Lmezzika WeQFaT <a:rnx_selfrole_smokemale:1360450579087888575> RTA7**')
            .setColor('#2b71ec');

        message.reply({ embeds: [embed] });
    } else if (command === "resume") {
        const player = client.riffy.players.get(message.guild.id); 
        if (!player) return message.channel.send("No player available.");

        player.pause(false);

        const embed = new EmbedBuilder()
            .setAuthor({
                name: 'Playback Resumed!',
                iconURL: 'https://cdn.discordapp.com/attachments/1175488636033175602/1175488720762310757/play.png?ex=656b6a2e&is=6558f52e&hm=ae4f01060fe8ae93f062d6574ef064ca0f6b4cf40b172f1bd54d8d405809c7df&',
                url: 'https://discord.gg/xQF9f9yUEM'
            })
            .setDescription('**lmzzika RJ3AT <a:playing60:1360826963216044223> ... ENJOY <a:musiccdspin:1360826877559832727> **')
            .setColor('#2b71ec');
        message.reply({ embeds: [embed] });
    }

    // باقي الأوامر تستمر بنفس الطريقة كما في الكود الأصلي...
});

client.riffy.on("nodeConnect", node => {
    console.log(`Node "${node.name}" connected.`)
});

client.riffy.on("nodeError", (node, error) => {
    console.log(`Node "${node.name}" encountered an error: ${error.message}.`)
});

client.riffy.on("trackStart", async (player, track) => {
    const musicard = await Classic({
        thumbnailImage: track.info.thumbnail,
        backgroundColor: "#070707",
        backgroundImage: "https://cdn.discordapp.com/attachments/1220001571228880917/1220001571690123284/01.png?ex=660d5a01&is=65fae501&hm=a8cfb44844e61aa0fd01767cd363af048df28966c30d7b04a59f27fa45cf69c4&",
        nameColor: "#FF7A00",
        progressColor: "#FF7A00",
        progressBarColor: "#5F2D00",
        progress: 50,
        name: track.info.title,
        author: `By ${track.info.author}`,
        authorColor: "#696969",
        startTime: "0:00",
        endTime: "4:00",
        timeColor: "#FF7A00"
    });

    fs.writeFileSync("musicard.png", musicard);
    const details = `**Title:** ${track.info.title}\n` +
    `**Author:** ${track.info.author}\n` +
    `**Seekable:** ${track.info.seekable}\n` +
    `**Stream:** ${track.info.stream}\n` +
    `**Requester:** ${track.info.requester}\n` +
    `**Source Name:** ${track.info.sourceName}`;

    const musicEmbed = new EmbedBuilder()
        .setColor("#FF7A00")
        .setAuthor({
            name: 'Currently playing a Track',
            iconURL: 'https://cdn.discordapp.com/attachments/1140841446228897932/1144671132948103208/giphy.gif', 
            url: 'https://discord.gg/AW2ppwDVts'
        })
        .setDescription(details)
        .setImage("attachment://musicard.png");

    const channel = client.channels.cache.get(player.textChannel);
    channel.send({ embeds: [musicEmbed], files: ["musicard.png"] });
});

client.riffy.on("queueEnd", async (player) => {
    const channel = client.channels.cache.get(player.textChannel);
    const autoplay = false;
    if (autoplay) {
        player.autoplay(player)
    } else {
        player.destroy();
        const embed = new EmbedBuilder()
            .setColor('#ffff00')
            .setAuthor({
                name: 'Queue Ended!',
                iconURL: 'https://cdn.discordapp.com/attachments/1230824451990622299/1230824519220985896/6280-2.gif?ex=6641e8a8&is=66409728&hm=149efc9db2a92eb90c70f0a6fb15618a5b912b528f6b1dcf1b517c77a72a733a&',
                url: 'https://discord.gg/xQF9f9yUEM'
            })
            .setDescription('**Bye Bye!, wala dir chi track akher ntmzko <a:hypercatvibe:1360827084863438889> ...**');
        channel.send({ embeds: [embed] });
    }
});

client.on("raw", (d) => {
    client.riffy.updateVoiceState(d);
});
