<template>
    <p class="form-inline">
        <b>Cooldown:</b>

        <input
            v-model.number="newCooldownDays"
            type="number"
            class="form-control mx-2"
            @change="setCooldownDate($event)"
        >

        <span class="small text-secondary">
            User can reapply on
            {{ newCooldownDate | toStandardDate }}

            <span
                v-if="hasChanged"
                data-toggle="tooltip"
                data-placement="top"
                title="not saved"
            >
                *
            </span>
        </span>
    </p>
</template>

<script>
import { mapGetters } from 'vuex';
import postData from '../../../../mixins/postData.js';

export default {
    name: 'Cooldown',
    mixins: [ postData ],
    data() {
        return {
            newCooldownDays: 0,
        };
    },
    computed: {
        ...mapGetters('evaluations', [
            'selectedEvaluation',
            'isApplication',
        ]),
        originDate () {
            return this.isApplication ? new Date(this.selectedEvaluation.createdAt) : new Date(this.selectedEvaluation.updatedAt);
        },
        originalCooldownDays () {
            let origin = new Date(this.originDate);
            let cooldown = new Date(this.selectedEvaluation.cooldownDate);

            return Math.round((cooldown - origin) / (1000*60*60*24));
        },
        newCooldownDate () {
            const newDate = new Date(this.originDate);
            newDate.setDate(newDate.getDate() + this.newCooldownDays);

            return newDate;
        },
        hasChanged () {
            return this.originalCooldownDays !== this.newCooldownDays;
        },
    },
    watch: {
        selectedEvaluation () {
            this.newCooldownDays = this.originalCooldownDays;
        },
    },
    mounted () {
        this.newCooldownDays = this.originalCooldownDays;
    },
    methods: {
        async setCooldownDate(e) {
            const result = await this.executePost(
                `/${this.isApplication ? 'appEval' : 'bnEval'}/setCooldownDate/` + this.selectedEvaluation.id,
                { cooldownDate: this.newCooldownDate },
                e
            );

            if (result && !result.error) {
                this.$store.commit('evaluations/updateEvaluation', result);
                this.$store.dispatch('updateToastMessages', {
                    message: `Saved cooldown date`,
                    type: 'success',
                });
            }
        },
    },
};
</script>