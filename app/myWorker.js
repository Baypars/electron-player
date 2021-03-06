let db;

  self.addEventListener(
    'message',
    function(e) {

      if (e.data.func === 'importNedb') {
        let DataStore = require('nedb');
        db = new DataStore({ filename: 'movies.db' });
      } else if (e.data.func === 'fetchData') {
        fetchData(e.data.files);
      } else if (e.data.func === 'firstLoop') {
        firstLoop(e.data.files);
      }
    },
    false
  );


  function fetchData(files) {
    db.loadDatabase((err) => {
      let pLooped = 0;
      let moviesArray = [...files];
      for (let i = 0, len = moviesArray.length; i < len; i++) {
        let movie = moviesArray[i];
        db.findOne(
          {
            $where: function() {
              if (movie.year !== undefined && !isNaN(parseInt(movie.year))) {
                return this.title.replace(':', '').replace(/'/, '').replace(/ - /, ' ').replace(/-/, ' ').toLowerCase().includes(movie.name[0].replace(/'/, '').trim().toLowerCase()) && this.year === movie.year.trim();
              } else {
                return this.title.replace(':', '').replace(/'/, '').replace(/ - /, ' ').replace(/-/, ' ').toLowerCase().includes(movie.name[0].replace(/'/, '').trim().toLowerCase());
              }
            }
          }, async (err, result) => {
            if (result !== null && result !== undefined) {
              moviesArray[i] = { ...movie, ...result };
            }
            pLooped++;
            checkPromise(pLooped, len, this, moviesArray);
          });
      }
    });
  }

  function checkPromise(looped, size, ctx, array) {
    self.postMessage({
      msg: 'onPercent', data: {
        fetchedPercent: (looped / size) * 100,
        mappedFilesOrg: array,
        mappedFiles: array
      }
    });
    if (looped === size) {
      self.postMessage({
        msg: 'fetchingFinished', data: {
          isDataLoading: false
        }
      });
    }
  }

  function firstLoop(items) {
    for (let i = 0, len = items.length; i < len; i++) {
      const x = items[i];
      const ext = x.substr(x.length - 3);
      let encoder =x.toLowerCase().match(/ganool|gan|yify|mkvcage|shaanig|f2m|pahe|rarbg|sparks|rmt|psa/);
      const coding =x.toLowerCase().match(/x265|x264/);
      let type =x.toLowerCase().replace('\.',' ').match(/bluray|b lu ry|blury|webdl|web-dl|blu ray|web dl|brrip|webrip/);
      if (type !== null) {
        type[0] === 'b lu ry' || type[0] === 'blury' || type[0] === 'brrip' ? type [0] = 'bluray' : type[0];
        type[0] === 'webdl' || type[0] === 'web dl' || type[0] === 'webrip' ? type [0] = 'web-dl' : type[0];

      }
      if (encoder !== null) {
        encoder[0] === 'gan'? encoder [0] = 'ganool' : encoder[0];
      }
      const nameObj = fileNameCorrector(x, ext);
      items[i] = {
        name: nameObj,
        path: x,
        ext: ext,
        year: nameObj[1],
        resolution: x.match(/\d{3,4}p/) !== null && x.match(/\d{3,4}p/) !== undefined ? x.match(/\d{3,4}p/)[0] : '',
        cast: [], genres: [], rating: '', director: '',
        encoder: encoder !== null ? encoder[0] : '',
        coding: coding !== null ? coding[0] : '',
        type: type !== null ? type[0] : ''
      };
    }
    self.postMessage({
      msg: 'scanningFinished', data: {
        mappedFilesOrg: items,
        mappedFiles: items,
        isLoading: false
      }
    });
    fetchData(items);
  }

  function fileNameCorrector(string, ext) {
    const stringObj = string.split('\\');

    const fileName = stringObj[stringObj.length - 1];

    return fileName
      .replace(`.${ext}`, '')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/\(/gi, '')
      .replace(/\)/gi, '')
      .replace(/\[/gi, '')
      .replace(/]/gi, '')
      .replace(/\./g, ' ')
      .replace(/_/gi, ' ')
      .replace(/-/gi, ' ')
      .split(/(?=([0-9]{4})+)/)
      .slice(0, 2);
  }///
