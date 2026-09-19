import { isEqual } from 'lodash';

export default {
    isObjectEqual
  }
  
  function isObjectEqual(previousObject,newObject) {
    return (isEqual(previousObject,newObject));
  }
