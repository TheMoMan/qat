<template>
    <div>
        <div v-if="loggedInUser.hasBasicAccess" class="col-sm-12 my-2" :class="otherUserComments.length ? 'mb-1' : ''">
            <a
                href="#"
                class="ml-2"
                :class="isMaxChecks || isOutdated ? 'disabled' : ''"
                @click.prevent="showInput = !showInput"
            >
                <i class="fas fa-edit" />
            </a>
            <span v-if="!showInput && !userComment">
                ...
            </span>
            <span
                v-else-if="!showInput"
                class="ml-1 small text-white"
                v-html="$md.render(userComment)"
            />
            <input
                v-if="showInput"
                v-model="userComment"
                :disabled="isMaxChecks || isOutdated"
                class="form-control form-control-sm"
                type="text"
                maxlength="1000"
                placeholder="enter to submit..."
                @keyup.enter="editComment($event)"
                @change="editComment($event)"
            >
        </div>

        <div v-if="otherUserComments.length" class="col-sm-12 mb-2">
            <ul class="small mb-0">
                <!-- if not maxchecks/outdated/currentuser, show Anoynmous: comment, otherwise show username: comment -->
                <li v-for="mediation in otherUserComments" :key="mediation.id">
                    {{ loggedInUser.isNat || isMaxChecks || isOutdated ? mediation.mediator.username + ':' : 'anonymous:' }}
                    <span v-html="$md.render(mediation.comment)" />
                </li>
            </ul>
        </div>
    </div>
</template>

<script>
import { mapState } from 'vuex';
import postData from '../../mixins/postData.js';

export default {
    name: 'Comments',
    mixins: [ postData ],
    props: {
        qualityAssuranceComments: {
            type: Array,
            default() {
                return [];
            },
        },
        eventId: {
            type: String,
            required: true,
        },
        isMaxChecks: Boolean,
        isOutdated: Boolean,
    },
    data() {
        return {
            showInput: false,
            userComment: null,
            mediationId: null,
        };
    },
    computed: {
        ...mapState([
            'loggedInUser',
        ]),
        otherUserComments() {
            return this.qualityAssuranceComments.filter(m => m.mediator.id != this.loggedInUser.id && m.comment.length);
        },
    },
    watch: {
        qualityAssuranceComments() {
            this.findRelevantComment();
        },
    },
    mounted() {
        this.findRelevantComment();
    },
    methods: {
        findRelevantComment() {
            this.userComment = null;
            this.mediationId = null;

            const userMediation = this.qualityAssuranceComments.find(m => m.mediator.id == this.loggedInUser.id);

            if (userMediation) {
                this.userComment = userMediation.comment;
                this.mediationId = userMediation.id;
            }
        },
        async editComment (e) {
            this.showInput = false;
            const event = await this.executePost('/qualityAssurance/editComment/' + this.eventId, { mediationId: this.mediationId, comment: this.userComment }, e);

            if (event && !event.error) {
                this.$store.commit('qualityAssurance/updateEvent', event);
                this.findRelevantComment();
            }
        },
    },
};
</script>
