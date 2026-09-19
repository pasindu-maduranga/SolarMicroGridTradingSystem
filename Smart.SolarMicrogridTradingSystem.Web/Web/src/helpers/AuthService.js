import token from './TokenDecoder'

export default {
    IsUserLogged
}

function IsUserLogged(){
    return token.isTokenExists();
}