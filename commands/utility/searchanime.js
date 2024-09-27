const {SlashCommandBuilder} = require('@discordjs/builders');
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
                message+=(`${data.data[i].node.title}\n`);
            }
        }
        await interaction.reply(`${message}`);

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