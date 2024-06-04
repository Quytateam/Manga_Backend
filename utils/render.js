const render = async (res, data, limit, page) => {
  const pageNumber = page == "" ? 1 : Number(page) || 1;
  const skip = (pageNumber - 1) * limit;
  const count = await data.length;

  const skippedManga = data.slice(skip);
  const manga = skippedManga.slice(0, limit);

  return res.json({
    manga,
    pageNumber,
    pages: Math.ceil(count / limit),
    total: count,
  });
  //   return res.json(manga);
};

const renderComment = async (res, data, limit, page) => {
  const pageNumber = page == "" ? 1 : Number(page) || 1;
  const skip = (pageNumber - 1) * limit;
  const count = await data.length;

  const skippedComment = data.slice(skip);
  const comment = skippedComment.slice(0, limit);

  return res.json({
    comment,
    pageNumber,
    pages: Math.ceil(count / limit),
    total: count,
  });
  //   return res.json(manga);
};

export { render, renderComment };
