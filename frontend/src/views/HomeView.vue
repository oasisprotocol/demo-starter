<script setup lang="ts">
import { onMounted, ref } from 'vue';

import { useMessageBox, useUnwrappedMessageBox } from '../contracts';
import { Network, useEthereumStore } from '../stores/ethereum';
import { abbrAddr } from '@/utils/utils';
import AppButton from '@/components/AppButton.vue';
import MessageLoader from '@/components/MessageLoader.vue';
import JazzIcon from '@/components/JazzIcon.vue';
import { retry } from '@/utils/promise';

const eth = useEthereumStore();
const messageBox = useMessageBox();
const uwMessageBox = useUnwrappedMessageBox();

const errors = ref<string[]>([]);
const message = ref('');
const author = ref('');
const newMessage = ref('');
const isLoading = ref(true);
const isSettingMessage = ref(false);
const isCorrectNetworkSelected = ref<Boolean>(true);

interface Message {
  message: string;
  author: string;
}

function handleError(error: Error, errorMessage: string) {
  errors.value.push(`${errorMessage}: ${error.message ?? JSON.stringify(error)}`);
  console.error(error);
}

async function fetchMessage(): Promise<Message> {
  const message = await messageBox.value!.message();
  const author = await messageBox.value!.author();

  return { message, author };
}

async function fetchAndSetMessageValues(): Promise<Message | null> {
  let retrievedMessage: Message | null = null;

  try {
    retrievedMessage = await fetchMessage();
    message.value = retrievedMessage.message;
    author.value = retrievedMessage.author;

    return retrievedMessage;
  } catch (e) {
    handleError(e as Error, 'Failed to get message');
  } finally {
    isLoading.value = false;
  }

  return retrievedMessage;
}

async function setMessage(e: Event): Promise<void> {
  if (e.target instanceof HTMLFormElement) {
    e.target.checkValidity();
    if (!e.target.reportValidity()) return;
  }

  e.preventDefault();

  try {
    const newMessageValue = newMessage.value;
    errors.value.splice(0, errors.value.length);
    isSettingMessage.value = true;

    await messageBox.value!.setMessage(newMessageValue);

    await retry<Promise<Message | null>>(fetchAndSetMessageValues, (retrievedMessage) => {
      if (retrievedMessage?.message !== newMessageValue) {
        throw new Error('Unable to determine if the new message has been correctly set!');
      }

      return retrievedMessage;
    });

    newMessage.value = '';
  } catch (e: any) {
    handleError(e, 'Failed to set message');
  } finally {
    isSettingMessage.value = false;
  }
}

async function switchNetwork() {
  await eth.switchNetwork(Network.FromConfig);
}

async function connectAndSwitchNetwork() {
  await eth.connect();
  isCorrectNetworkSelected.value = await eth.checkIsCorrectNetwork();
  if (!isCorrectNetworkSelected.value) {
    await switchNetwork();
  }
  isCorrectNetworkSelected.value = await eth.checkIsCorrectNetwork();
}

onMounted(async () => {
  await connectAndSwitchNetwork();
  await fetchAndSetMessageValues();
});
</script>

<template>
  <section class="pt-5" v-if="isCorrectNetworkSelected">
    <h1 class="capitalize text-2xl text-white font-bold mb-4">Demo starter</h1>

    <h2 class="capitalize text-xl text-white font-bold mb-4">Active message</h2>

    <div class="message p-6 mb-6 rounded-xl border-2 border-gray-300" v-if="!isLoading">
      <div class="flex items-center justify-between">
        <h2 class="text-lg lg:text-lg m-0">{{ message }}</h2>
        <div class="flex items-center flex-shrink-0">
          <JazzIcon class="mr-2" :size="20" :address="author" />
          <abbr :title="author" class="font-mono block no-underline">{{ abbrAddr(author) }}</abbr>
        </div>
      </div>
    </div>
    <div v-else>
      <div class="message p-6 pt-4 mb-6 rounded-xl border-2 border-gray-300">
        <MessageLoader />
      </div>
    </div>

    <h2 class="capitalize text-xl text-white font-bold mb-4">Set message</h2>
    <p class="text-base text-white mb-10">
      Set your new message by filling the message field bellow.
    </p>

    <form @submit="setMessage">
      <div class="form-group">
        <input
          type="text"
          id="newMessageText"
          class="peer"
          placeholder=" "
          v-model="newMessage"
          required
          :disabled="isSettingMessage"
        />

        <label
          for="newMessageText"
          class="peer-focus:text-primaryDark peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-5"
        >
          New message:
          <span class="text-red-500">*</span>
        </label>
      </div>

      <AppButton type="submit" variant="primary" :disabled="isSettingMessage">
        <span v-if="isSettingMessage">Setting…</span>
        <span v-else>Set Message</span>
      </AppButton>

      <div v-if="errors.length > 0" class="text-red-500 px-3 mt-5 rounded-xl-sm">
        <span class="font-bold">Errors:</span>
        <ul class="list-disc px-8">
          <li v-for="error in errors" :key="error">{{ error }}</li>
        </ul>
      </div>
    </form>
  </section>
  <section class="pt-5" v-else>
    <h2 class="capitalize text-white text-2xl font-bold mb-4">Invalid network detected</h2>
    <p class="text-white text-base mb-20">
      In order to continue to use the app, please switch to the correct chain, by clicking on the
      bellow "Switch network" button
    </p>

    <div class="flex justify-center">
      <AppButton variant="secondary" @click="switchNetwork">Switch network</AppButton>
    </div>
  </section>
</template>

<style scoped lang="postcss">
input {
  @apply block my-4 p-1 mx-auto text-3xl border border-gray-400 rounded-xl;
}

.form-group {
  @apply relative mb-6;
}

.form-group input,
textarea {
  @apply block rounded-xl py-6 px-5 w-full text-base text-black appearance-none focus:outline-none focus:ring-0 bg-white;
}

.form-group label {
  @apply absolute text-base text-primaryDark duration-300 transform -translate-y-5 scale-75 top-6 z-10 origin-[0] left-5;
}

.message {
  @apply bg-white rounded-xl border-primary;
  border-width: 3px;
  border-style: solid;
  box-shadow: 0 7px 7px 0 rgba(0, 0, 0, 0.17);
}
</style>
