const { create_list,
    delete_list,
    get_list,
    update_list,
    get_list_id,
    get_all_list } = require('../controllers/listController')
    
const verify = require('../middleware/verifyToken')

const router = require('express').Router()



router.post('/', verify, create_list)

router.delete('/:id', verify, delete_list)

router.put('/:id', verify, update_list)

router.get('/find', verify, get_list)

router.get('/', verify, get_all_list)

router.get('/find/:id', verify, get_list_id)


module.exports = router