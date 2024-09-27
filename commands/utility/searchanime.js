const {SlashCommandBuilder} = require('@discordjs/builders');
const { MAL_KEY } = require('../../config.json');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

module.exports = {
    data: new SlashCommandBuilder()
        .setName('searchanime')
        .addStringOption(option => 
            option.setName('anime')
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
        .setDescription('Search for an anime on MyAnimeList'),
    async execute(interaction) {
        const data = await requestAnime(interaction.options.getString("anime"), interaction.options.getInteger("amount"));
        let message = ""
        if (data.data.length > 0) {
            for (let i = 0; i < data.data.length; i++) {
                message+=(`${data.data[i].node.title}\n`);
            }
        }
        await interaction.reply(`${message}`);
    }
};

async function requestAnime(searchParams, searchAmount) {
    const params = new URLSearchParams();
    params.append('q', searchParams);
    params.append('limit', searchAmount);
    params.append('fields', 'rank,mean,alternative_title');
    console.log(`https://api.myanimelist.net/v2/anime?` + params)
    return new Promise((resolve, reject) => {
        fetch(`https://api.myanimelist.net/v2/anime?` + params, {
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


function base64urlencode(a) {
    var str = "";
    var bytes = new Uint8Array(a);
    var len = bytes.byteLength;
    for (var i = 0; i < len; i++) {
        str += String.fromCharCode(bytes[i]);
    }
    return btoa(str)
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
};
