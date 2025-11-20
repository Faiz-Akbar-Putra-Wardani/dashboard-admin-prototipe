//import pinia
import { defineStore } from 'pinia'

//import services api
import Api from '../services/api'

//import js cookie
import Cookies from 'js-cookie'

//define store
export const useUser = defineStore('user', {
    state: () => {
        return {
            user: Cookies.get('user') ? JSON.parse(Cookies.get('user')) : {},
            token: Cookies.get('token') || '',
        }
    },
    actions: {
        //action "login"
        async login(credentials) {
            //fetch API
            await Api.post('/api/login', credentials)
            .then((response) => {

                //set state
                this.user = response.data.data.user
                this.token = response.data.data.token

                //set cookies untuk menyimpan token dan data user
                Cookies.set('token', response.data.data.token)
                Cookies.set('user', JSON.stringify(response.data.data.user))

            })
        },

        //action "logout"
        async logout() {
            
            //set state
            this.user = {}
            this.token = ''

            //remove cookies
            Cookies.remove('token')
            Cookies.remove('user')

        },

    },
    getters: {
        getUser: (state) => state.user,
        getToken: (state) => state.token
    }
})