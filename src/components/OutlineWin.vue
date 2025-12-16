<template>
	<WinSwitcherByPage v-model="page">
		<Outline :page="page" />
	</WinSwitcherByPage>
</template>

<script setup lang="ts">
import Outline from './Outline.vue'
import WinSwitcherByPage from './WinSwitcherByPage.vue'
import { shallowRef } from 'vue'
import type { PageInfo } from 'virtual:pages-info'
const page = shallowRef<PageInfo | undefined>()
</script>