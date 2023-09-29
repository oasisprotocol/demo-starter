<script setup lang="ts">
import { onMounted, ref } from 'vue';

import type { MessageBox } from '../contracts';
import {useMessageBox, useUnwrappedMessageBox} from '../contracts';
import { useGasless } from '../contracts';
import { Network, useEthereumStore } from '../stores/ethereum';
import AppButton from '@/components/AppButton.vue';
import MessageLoader from '@/components/MessageLoader.vue';

const eth = useEthereumStore();
const messageBox = useMessageBox();
const uwMessageBox = useUnwrappedMessageBox();
const gasless = useGasless();

const errors = ref<string[]>([]);
const message = ref('');
const author = ref('');
const newMessage = ref('');
const isLoading = ref(true);
const isSettingMessage = ref(false);
const isGasless = ref(false);

const privateMessage = ref('');
const privateAuthor = ref('');
const newPrivateMessage = ref('');
const newPrivateMessageRecipient = ref('');
const isSettingPrivateMessage = ref(false);
const newPrivateCaptcha = ref('');
const privateCaptcha = ref<Record<number, number>>([0, 0]);

async function fetchMessage(): Promise<Record<string, string>> {
  const message = await uwMessageBox.value.message();
  const author = await uwMessageBox.value.author();

  return { message, author };
}


async function fetchPrivateMessage(): Promise<Record<string, string>> {
  const [ message, author ] = await messageBox.value.readPrivateMessage();
  return { message, author };
}

async function fetchPrivateCaptcha(): Promise<Record<number, number>> {
  const [ a, b ] = await uwMessageBox.value.computeCaptcha();
  return [ a.toNumber(), b.toNumber() ];
}

async function setMessage(e: Event): Promise<void> {
  if (e.target instanceof HTMLFormElement) {
    e.target.checkValidity();
    if (!e.target.reportValidity()) return;
  }
  e.preventDefault();
  try {
    errors.value.splice(0, errors.value.length);
    isLoading.value = true;

    if (!isGasless.value) {
      await messageBox.value.setMessage(newMessage.value);
    } else {
      const innercall = messageBox.value.interface.encodeFunctionData('setMessage', [
        newMessage.value,
      ]);
      const tx = await gasless.value.makeProxyTx(messageBox.value.address, innercall);
      const resp = await eth.unwrappedProvider.sendTransaction(tx);
      const receipt = await eth.unwrappedProvider.waitForTransaction(resp.hash);
    }
  } catch (e: any) {
    errors.value.push(`Failed to set message: ${e.message ?? JSON.stringify(e)}`);
    console.error(e);
  } finally {
    isLoading.value = false;
  }
}

async function setPrivateMessage(e: Event): Promise<void> {
  if (e.target instanceof HTMLFormElement) {
    e.target.checkValidity();
    if (!e.target.reportValidity()) return;
  }
  e.preventDefault();
  try {
    errors.value.splice(0, errors.value.length);
    isLoading.value = true;
    await messageBox.value.setPrivateMessage(newPrivateMessageRecipient.value, newPrivateMessage.value, newPrivateCaptcha.value);
  } catch (e: any) {
    errors.value.push(`Failed to set message: ${e.message ?? JSON.stringify(e)}`);
    console.error(e);
  } finally {
    isLoading.value = false;
  }
}

onMounted(async () => {
  await eth.connect();
  await eth.switchNetwork(Network.FromConfig);

  await Promise.all([
    fetchMessage().then((ret) => {
      message.value = ret.message;
      author.value = ret.author;
      isLoading.value = false;
    }),
    fetchPrivateMessage().then((ret) => {
      privateMessage.value = ret.message;
      privateAuthor.value = ret.author;
      isLoading.value = false;
    }),
    fetchPrivateCaptcha().then((ret) => {
      privateCaptcha.value = ret;
    }),
  ]);
});
</script>

<template>
  <section class="pt-5">
    <h2 class="capitalize">Demo Starter</h2>

    <p class="text-base">Message:</p>
    <div v-if="!isLoading">
      <p class="text-base">{{ message }}</p>
    </div>
    <div v-else><MessageLoader/></div>
    <p class="text-base">Author:</p>
    <div v-if="!isLoading">
      <p class="text-base">{{ author }}</p>
    </div>
    <div v-else><MessageLoader/></div>

    <br/>
    <p class="text-base">Private message:</p>
    <div v-if="!isLoading">
      <p class="text-base">{{ privateMessage }}</p>
    </div>
    <div v-else><MessageLoader/></div>
    <p class="text-base">Private message author:</p>
    <div v-if="!isLoading">
      <p class="text-base">{{ privateAuthor }}</p>
    </div>
    <div v-else><MessageLoader/></div>
    <br/>

    <form @submit="setMessage">
      <label
          for="newMessageText"
          class="peer-focus:text-primaryDark peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-5"
      >
        New message:
        <span class="text-red-500">*</span>
      </label>
      <input type="text" id="newMessageText" class="peer" placeholder=" " v-model="newMessage" required />

      <input type="checkbox" id="checkbox" v-model="isGasless">
      <label for="checkbox">Gasless transaction</label><br/>

      <AppButton type="submit" variant="primary" :disabled="isSettingMessage">
        <span v-if="isSettingMessage">Setting…</span>
        <span v-else>Set Message</span>
      </AppButton>
    </form>

    <form @submit="setPrivateMessage">
      <label
          for="newPrivateMessageRecipient"
          class="peer-focus:text-primaryDark peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-5"
      >
        New private message recipient:
        <span class="text-red-500">*</span>
      </label>
      <input type="text" id="newPrivateMessageRecipient" class="peer" placeholder=" " v-model="newPrivateMessageRecipient" required />

      <label
          for="newPrivateMessageText"
          class="peer-focus:text-primaryDark peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-5"
      >
        New private message:
        <span class="text-red-500">*</span>
      </label>
      <input type="text" id="newPrivateMessageText" class="peer" placeholder=" " v-model="newPrivateMessage" required />

      <label
          for="newPrivateCaptchaText"
          class="peer-focus:text-primaryDark peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-5"
      >
        {{ privateCaptcha[0] }} + {{ privateCaptcha[1] }} =
        <span class="text-red-500">*</span>
      </label>
      <input type="text" id="newPrivateCaptchaText" class="peer" placeholder=" " v-model="newPrivateCaptcha" required />

      <AppButton type="submit" variant="primary" :disabled="isSettingPrivateMessage">
        <span v-if="isSettingPrivateMessage">Setting…</span>
        <span v-else>Set Private Message</span>
      </AppButton>
    </form>
  </section>
</template>

<style scoped lang="postcss">
form {
  @apply text-center;
}

input {
  @apply block my-4 p-1 mx-auto text-3xl text-center border border-gray-400 rounded-xl;
}

h2 {
  @apply font-bold text-2xl my-2;
}
</style>
