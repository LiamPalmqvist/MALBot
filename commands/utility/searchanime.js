const {SlashCommandBuilder, StringSelectMenuBuilder, ActionRowBuilder, ButtonBuilder} = require('@discordjs/builders');
const { MAL_KEY } = require('../../config.json');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

module.exports = {
    data: new SlashCommandBuilder()
        .setName('search')
        .setDescription('Search for an anime or manga')
        .addSubcommand(subcommand =>
            subcommand.setName('anime')
            .setDescription('Search for an anime')
            .addStringOption(option => 
                option.setName('title')
                    .setDescription('The anime title to search for')
                    .setRequired(true)
            )
            .addIntegerOption(option =>
                option.setName('amount')
                    .setDescription('The amount of results to return')
                    .setRequired(true)
                    .setMaxValue(10)
                    .setMinValue(1)
            )
        )
        .addSubcommand(subcommand =>
            subcommand.setName('manga')
            .setDescription('Search for a manga')
            .addStringOption(option => 
                option.setName('title')
                    .setDescription('The manga title to search for')
                    .setRequired(true)
            )
            .addIntegerOption(option =>
                option.setName('amount')
                    .setDescription('The amount of results to return')
                    .setRequired(true)
                    .setMaxValue(10)
                    .setMinValue(1)
            )
        ),
    async execute(interaction) {
        
        console.log(interaction.options.getString("title"));
        
        const data = await search(interaction.options.getString("title"), interaction.options.getInteger("amount"), `${interaction.options.getSubcommand()}?`);
        console.log(data);
        let message = ""
        if (data.data.length > 0) {
            for (let i = 0; i < data.data.length; i++) {
                message+=(`${i}. ${data.data[i].node.title}\n`);
            }
        }

        /*
        const arrowLeft = new ButtonBuilder()
        .setCustomId("left")
        .setLabel("⬅️")
        .setStyle("Primary")

        const arrowRight = new ButtonBuilder()
        .setCustomId("right")
        .setLabel("➡️")
        .setStyle("Primary")
        */
        const select = new StringSelectMenuBuilder()
        .setCustomId('select')
        .addOptions(
            data.data.map((item, index) => {
                return {
                    label: item.node.title,
                    value: index.toString()
                }
            })
        )

        const row = new ActionRowBuilder()
            //.addComponents(arrowLeft)
            .addComponents(select)
            //.addComponents(arrowRight);

        const response = await interaction.reply({
            content: `${message}`, 
            components: [row],
        });

        // This filter will ensure that the collector will only listen for interactions from the user who initiated the command
        const collectorFilter = i => i.user.id === interaction.user.id;

        try {
            const confirmation = await response.awaitMessageComponent({ filter: collectorFilter, time: 60_000 });
            console.log(confirmation.values[0]);
            const entry = await grabEntry(data.data[confirmation.values[0]].node.id, `${interaction.options.getSubcommand()}`);
            console.log(entry);
            await interaction.editReply({ content: `Title: ${entry.title}\nRank: ${entry.rank}\Score: ${entry.mean}\nAlternative Title: ${entry.alternative_title}`, components: [] });
        } catch(e) {
            console.error(e);
            await interaction.editReply({ content: 'No selection was made within a minute.', components: [] });
        }
    }
};

async function search(searchParams, searchAmount, animeOrManga) {
    const params = new URLSearchParams();
    params.append('q', searchParams);
    params.append('limit', searchAmount);
    params.append('fields', 'rank,mean,alternative_title');
    console.log("https://api.myanimelist.net/v2/" + animeOrManga + params);
    return new Promise((resolve, reject) => {
        fetch('https://api.myanimelist.net/v2/' + animeOrManga + params, {
            method: 'GET',
            headers: {
                "X-MAL-CLIENT-ID": MAL_KEY,
            }
        })
        .then(response => response.json())
        .then(data => {
            console.log(data);
            resolve(data);
        })
        .catch(error => {
            console.error(error);
            reject(error);
        });
    })
};

async function grabEntry(titleID, animeOrManga) {
    const params = new URLSearchParams();
    params.append('fields', 'rank,mean,alternative_title');
    console.log(`https://api.myanimelist.net/v2/${animeOrManga}/${titleID}`);
    return new Promise((resolve, reject) => {
        fetch(`https://api.myanimelist.net/v2/${animeOrManga}/${titleID}?${params}`, {
            method: 'GET',
            headers: {
                "X-MAL-CLIENT-ID": MAL_KEY,
            }
        })
        .then(response => response.json())
        .then(data => {
            console.log(data);
            resolve(data);
        })
        .catch(error => {
            console.error(error);
            reject(error);
        });
    })
};