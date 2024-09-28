const {SlashCommandBuilder, StringSelectMenuBuilder, ActionRowBuilder, EmbedBuilder, ButtonBuilder} = require('@discordjs/builders');
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
            /*.addIntegerOption(option =>
                option.setName('amount')
                    .setDescription('The amount of results to return')
                    .setRequired(true)
                    .setMaxValue(10)
                    .setMinValue(1)
            )*/
        )

        .addSubcommand(subcommand =>
            subcommand.setName('manga')
            .setDescription('Search for a manga')
            .addStringOption(option => 
                option.setName('title')
                    .setDescription('The manga title to search for')
                    .setRequired(true)
            )
            /*
            .addIntegerOption(option =>
                option.setName('amount')
                    .setDescription('The amount of results to return')
                    .setRequired(true)
                    .setMaxValue(10)
                    .setMinValue(1)
            )
            */
        ),
    async execute(interaction) {
        
        console.log(interaction.options.getString("title"));
        
        const data = await search(interaction.options.getString("title"), interaction.options.getInteger("amount"), `${interaction.options.getSubcommand()}?`);
        console.log(data);
        const message = new EmbedBuilder()
            .setColor(0x0099ff)
            .setTitle(`Search results for ${interaction.options.getString("title")}`)
            .setTimestamp()
            .setFooter({ text: 'Powered by MyAnimeList', iconURL: 'https://cdn.myanimelist.net/img/sp/icon/apple-touch-icon-256.png'});

        if (await data.data.length > 0) {
            for (let i = 0; i < data.data.length; i++) {
                message.addFields(
                    { name: ` `, value: `${i+1}. ${data.data[i].node.title}`, inline: false }
                )
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
            embeds: [message], 
            components: [row],
        });

        // This filter will ensure that the collector will only listen for interactions from the user who initiated the command
        const collectorFilter = i => i.user.id === interaction.user.id;

        try {
            const confirmation = await response.awaitMessageComponent({ filter: collectorFilter, time: 60_000 });
            console.log(confirmation.values[0]);
            const entry = await grabEntry(data.data[confirmation.values[0]].node.id, `${interaction.options.getSubcommand()}`);

            // ================== Embed Builder ==================
            
            const message = new EmbedBuilder()
                .setColor(0x0099ff)
                .setTitle(`${entry.title}`)
                .setURL(`https://myanimelist.net/${interaction.options.getSubcommand()}/${entry.id}`)
                .setThumbnail(entry.main_picture.large??entry.main_picture.medium??entry.main_picture.small)
                .addFields(
                    { name: 'Alternate titles', value: `${entry.alternative_titles.ja}`, inline: true },
                    { name: 'Rank', value: `${entry.rank === undefined ? "Unranked" : entry.rank}`, inline: true },
                    { name: 'Score', value: `${entry.mean === undefined ? "No score" : entry.mean}`, inline: true },
                    { name: 'Start Date', value: `${entry.start_date===undefined ? "TDA" : entry.start_date}`, inline: true }
                )
                .setTimestamp()
                .setFooter({ text: 'Powered by MyAnimeList', iconURL: 'https://cdn.myanimelist.net/img/sp/icon/apple-touch-icon-256.png'});

            if (entry.end_date !== undefined) {   
                switch (interaction.options.getSubcommand()) {
                case 'anime':
                    message.addFields(
                        { name: 'End Date', value: `${entry.end_date}`, inline: true },
                        { name: 'Episodes', value: `${entry.num_episodes}`, inline: true },
                    )
                    break;
                case 'manga':
                    message.addFields(
                        { name: 'End Date', value: `${entry.end_date}`, inline: true },
                        { name: 'Chapters', value: `${entry.num_chapters}`, inline: true },
                    )
                    break;
                default:
                    break;
                }
            } else {
                switch (entry.status) {
                case 'currently_publishing':
                    message.addFields(
                        { name: 'Status', value: `Currently publishing`, inline: true },
                    );
                    break;
                case 'currently_airing':
                    message.addFields(
                        { name: 'Status', value: `Currently airing`, inline: true },
                    );
                    break;
                default:
                    break;
                }
            }

            if (entry.synopsis.length > 1024) {
                message.addFields({name: '\u200B', value: `\u200B`, inline: false});
                message.addFields({name: 'Synopsis', value: `${entry.synopsis.substring(0, 950)}... [Read more](https://myanimelist.net/${interaction.options.getSubcommand()}/${entry.id}#synopsis)`, inline: false});
            } else {
                message.addFields({name: '\u200B', value: `\u200B`, inline: false});
                message.addFields({name: 'Synopsis', value: `${entry.synopsis}`, inline: false});
            }

            // ================== End Embed Builder ==================

            // await interaction.editReply({ content: `${entry.main_picture.large}\nTitle: ${entry.title}\nRank: ${entry.rank}\nScore: ${entry.mean}\nAlternative Title: ${entry.alternative_title}`, components: [] });
            await interaction.deleteReply();
            await interaction.followUp({ embeds: [message] });
        } catch(e) {
            console.error(e);
            await interaction.deleteReply();
            await interaction.followUp({ content: 'No selection was made within a minute.', components: [] });
        }
    }
};

// Searches for the anime or manga using a title specified in the searchParams
async function search(searchParams, searchAmount, animeOrManga) {
    const params = new URLSearchParams();
    params.append('q', searchParams);
    params.append('limit', 10);
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

// Grabs the entry of the anime or manga from the API using the titleID returned from the search function
async function grabEntry(titleID, animeOrManga) {
    const params = new URLSearchParams();
    // Add the fields you want to retrieve from the API
    // Unfortunatly, the API does not allow you to retrieve all fields at once
    // So this needs to be as long as it currently is :(
    params.append('fields', 'id,title,main_picture,alternative_titles,start_date,end_date,synopsis,mean,rank,popularity,num_list_users,num_scoring_users,nsfw,created_at,updated_at,media_type,status,genres,my_list_status,num_episodes,start_season,broadcast,source,average_episode_duration,rating,pictures,background,related_anime,related_manga,recommendations,studios,statistics');
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

// This currently returns [blob Promise] instead of the image
async function grabImage(url) {
    return new Promise((resolve, reject) => {
        fetch(url)
        .then(response => response.blob())
        .then(data => {
            console.log(data);
            resolve(data);
        })
        .catch(error => {
            console.error(error);
            reject(error);
        });
    })
}