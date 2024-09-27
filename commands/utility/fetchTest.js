const {SlashCommandBuilder} = require('@discordjs/builders');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

module.exports = {
    data: new SlashCommandBuilder()
        .setName('fetchtest')
        .addStringOption(option => 
            option.setName('input')
                .setDescription('The input to echo back')
                .setRequired(true)
        )
        .setDescription('Replies with a fetchRequest!'),
    async execute(interaction) {
        const data = await requestData();
       //await interaction.reply(`${interaction.options.getString("input")}`);
        await interaction.reply(`${data.title}`);
    }
};

// test function which makes a web request and returns the data
async function requestData() { 
    return new Promise((resolve, reject) => {
        fetch('https://jsonplaceholder.typicode.com/todos/1')
            .then(response => response.json())
            .then(data => {
                console.log(data);
                resolve(data);
            })
            .catch(error => {
                console.error(error);
                reject(error);
            });
    });
}