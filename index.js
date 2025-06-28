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
  if (interaction.isStringSelectMenu()) {
    if (interaction.customId === 'application_selector') {
      const selected = interaction.values[0];

      if (selected === 'main') {
        const modal = new ModalBuilder()
          .setCustomId('main_application')
          .setTitle('Подать заявку в MAIN');

        const inputs = [
          { id: 'full_name', label: 'Имя и фамилия в игре', style: TextInputStyle.Short },
          { id: 'stat_id', label: 'Статистический ID', style: TextInputStyle.Short },
          { id: 'prime_time', label: 'Ваш прайм-тайм ( основное, наилучшее время нахождения в игре )', style: TextInputStyle.Paragraph },
          { id: 'karaba_link', label: 'Откат стрельбы GunGame (Караба, бой насмерть, от 2-ух минут)', style: TextInputStyle.Short },
          { id: 'saiga_link', label: 'Откат стрельбы GunGame (Сайга, бой насмерть, от 2-ух минут)', style: TextInputStyle.Short },
          { id: 'discord_name', label: 'Ваш Discord (пример: user#0000)', style: TextInputStyle.Short },
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

        modal.addComponents(...rows);
        await interaction.showModal(modal);
      }
    }
  }

  if (interaction.type === InteractionType.ModalSubmit && interaction.customId === 'main_application') {
    const get = (id) => interaction.fields.getTextInputValue(id);

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setDescription(
        `**Имя и фамилия в игре**\n${get('full_name')}\n\n` +
        `**Статистический ID**\n${get('stat_id')}\n\n` +
        `**Ваш прайм-тайм ( основное, наилучшее время нахождения в игре )**\n${get('prime_time')}\n\n` +
        `**Откат стрельбы GunGame (Караба, бой насмерть, от 2-ух минут)**\n${get('karaba_link')}\n\n` +
        `**Откат стрельбы GunGame (Сайга, бой насмерть, от 2-ух минут)**\n${get('saiga_link')}\n\n` +
        `**Ваш Discord**\n${get('discord_name')}\n\n` +
        `${dayjs().format('D/M/YYYY H:mm')}`
      );

    const leader = `<@&${LEADER_ROLE_ID}>`;
    const deputy = `<@&${DEPUTY_ROLE_ID}>`;
    const high = `<@&${HIGH_ROLE_ID}>`;

    const logChannel = interaction.guild.channels.cache.get(CHANNEL_LOG_MAIN_ID);
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
