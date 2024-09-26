const {SlashCommandBuilder} = require('@discordjs/builders');

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
        await interaction.reply(`${interaction.options.getString("input")}`);
    }
};