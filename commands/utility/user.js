const {SlashCommandBuilder} = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('user')
        .setDescription('Replies with information about the user that issued the command!'),
    async execute(interaction) {
        // interaction.user is the user who issued the command
        // interaction.member is the GuildMember Object, which represents the user in the specific Guild
        await interaction.reply(`User ${interaction.user.username}, who joined at ${interaction.member.joinedAt}!`);
    }
};