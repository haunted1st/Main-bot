require('dotenv').config();
const express = require('express');
const app = express();
app.get('/', (_, res) => res.send('✅ Бот работает!'));
app.listen(3000, () => console.log('🌐 Express-сервер запущен на порту 3000'));

const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  Events,
  InteractionType,
} = require('discord.js');

const dayjs = require('dayjs');
const relativeTime = require('dayjs/plugin/relativeTime');
dayjs.extend(relativeTime);

// Настройки
const INVITE_CHANNEL_ID = '1387148896320487564';
const LEADER_ROLE_ID = '1200040982746517595';
const DEPUTY_ROLE_ID = '1200045928460058768';
const HIGH_ROLE_ID = '1200046656666730527';
const CHANNEL_LOG_MAIN_ID = '1300952587930959942';

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// Отправка SELECT меню
client.once(Events.ClientReady, async () => {
  console.log(`🤖 Бот запущен как ${client.user.tag}`);

  const channel = await client.channels.fetch(INVITE_CHANNEL_ID);
  if (!channel) return console.error('❌ Канал не найден');

  const menu = new StringSelectMenuBuilder()
    .setCustomId('application_selector')
    .setPlaceholder('Выберите тип заявки')
    .addOptions([{ label: 'Main', value: 'main', emoji: '📝' }]);

  const row = new ActionRowBuilder().addComponents(menu);

  await channel.send({ content: 'Выберите тип заявки:', components: [row] });
});

// Обработка меню и формы
client.on(Events.InteractionCreate, async (interaction) => {
  // Выбор типа заявки
  if (interaction.isStringSelectMenu() && interaction.customId === 'application_selector') {
    if (interaction.values[0] === 'main') {
      const modal = new ModalBuilder()
        .setCustomId('main_application')
        .setTitle('Заявка в MAIN');

      const inputs = [
        { id: 'full_name', label: 'Имя и фамилия в игре', style: TextInputStyle.Short },
        { id: 'stat_id', label: 'Статистический ID', style: TextInputStyle.Short },
        { id: 'prime_time', label: 'Ваш прайм-тайм', style: TextInputStyle.Paragraph },
        { id: 'karaba_link', label: 'Откат стрельбы (Караба)', style: TextInputStyle.Short },
        { id: 'saiga_link', label: 'Откат стрельбы (Сайга)', style: TextInputStyle.Short },
        { id: 'discord_name', label: 'Ваш Discord', style: TextInputStyle.Short },
      ];

      const rows = inputs.map(input =>
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId(input.id)
            .setLabel(input.label)
            .setStyle(input.style)
            .setRequired(true)
        )
      );

      modal.addComponents(...rows.slice(0, 5)); // Discord API максимум 5 компонентов
      await interaction.showModal(modal);
    }
  }

  // Обработка отправки формы
  if (interaction.type === InteractionType.ModalSubmit && interaction.customId === 'main_application') {
    const get = (id) => interaction.fields.getTextInputValue(id);

    const embed = new EmbedBuilder()
      .setTitle('**Новая заявка в MAIN**')
      .setColor(0x5865f2)
      .setDescription(
        `**Имя и фамилия в игре**\n${get('full_name')}\n\n` +
        `**Статистический ID**\n${get('stat_id')}\n\n` +
        `**Ваш прайм-тайм ( основное, наилучшее время нахождения в игре )**\n${get('prime_time')}\n\n` +
        `**Откат стрельбы GunGame (Караба, бой насмерть, от 2-ух минут)**\n${get('karaba_link')}\n\n` +
        `**Откат стрельбы GunGame (Сайга, бой насмерть, от 2-ух минут)**\n${get('saiga_link')}\n\n` +
        `**Ваш Discord**\n${get('discord_name')}\n\n` +
        `${dayjs().format('M/D/YYYY H:mm')}`
      );

    const logChannel = interaction.guild.channels.cache.get(CHANNEL_LOG_MAIN_ID);
    const leader = `<@&${LEADER_ROLE_ID}>`;
    const deputy = `<@&${DEPUTY_ROLE_ID}>`;
    const high = `<@&${HIGH_ROLE_ID}>`;

    if (logChannel) {
      await logChannel.send({
        content: `${leader} ${deputy} ${high} **Новая заявка в MAIN**`,
        embeds: [embed],
      });
    }

    await interaction.reply({ content: '✅ Заявка успешно отправлена!', ephemeral: true });
  }
});

client.login(process.env.TOKEN);
