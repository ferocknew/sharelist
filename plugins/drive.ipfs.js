/*
 * ipfs
 * ipfs 列目录
 */

const name = 'ipfs'
const version = '1.0'
const protocols = ['ipfs']
const defaultProtocol = 'ipfs'
const path = require('path')
const { URL } = require("url")
const { Writable } = require('stream')
const cheerio = require('cheerio');
const clientMap = {}

module.exports = ({ request, getConfig, cache, base64, retrieveSize, extname }) => {

  const getContent = async (p) => {
    // console.info({ p });
    let resp = await request.get(p);

    const data = []
    if (resp.body) {
      const $ = cheerio.load(resp.body, { decodeEntities: false });
      let domTable = $("tr");
      i = 0;
      for (let value of domTable) {
        if (i != 0) {
          // console.info({ value });
          let aDom = $(value).find('a');
          let blankFlag = $(value).find('div.ipfs-_blank');
          let blankFlagLength = blankFlag.length;
          let fileType = (blankFlagLength == 1) ? "folder" : "file";

          let a0 = aDom[0]

          let link = $(a0).attr('href');
          let fileName = $(a0).text();

          let noLinebreak = $(value).find(".no-linebreak")[1];
          let sizeValue = $(noLinebreak).text();
          sizeValue = sizeValue.replace(/kB/, "KB");
          // console.info({ sizeValue })


          data.push({
            type: fileType,
            filename: fileName,
            lastmod: "",
            size: retrieveSize(sizeValue)
          });
          // break;
        }
        i++;
      }

      // resp.body.replace(/<tr><td.*?>(.*?)<\/td><td.*?><a.*?>(.*?)<\/a><\/td><td.*?>(.*?)<\/td><td.*?>(.*?)<\/td><\/tr>/g, ($0, $1, $2, $3, $4) => {
      //   console.info([$0, $1, $2, $3, $4]);
      //   if ($0.indexOf('href=".."') == -1) {
      //     data.push({
      //       type: $1.indexOf('folder') >= 0 ? 'folder' : 'file',
      //       filename: $2,
      //       lastmod: $3,
      //       size: retrieveSize($4),
      //     })
      //   }
      // })
    }
    return data
  }


  const folder = async (id) => {
    //let [server , path] = id.split('>');
    let resp = { id: id, type: 'folder', protocol: defaultProtocol }

    let data = await getContent(id)

    let children = [];
    data.forEach(i => {
      let path = (id + '/' + i.filename)
      let obj = {
        id: path,
        name: i.filename,
        protocol: defaultProtocol,
        size: i.size,
        created_at: i.lastmod,
        updated_at: i.lastmod,
        ext: extname(i.filename),
        type: i.type
      }

      children.push(obj)
    })

    resp.$cached_at = Date.now()
    resp.children = children
    //cache.set(resid, resp)

    return resp
  }

  const file = async (id, { data = {} } = {}) => {

    data.url = id
    // data.outputType = 'stream'
    //data.proxy = 'stream'
    return data
  }

  return { name, version, drive: { protocols, folder, file } }
}
