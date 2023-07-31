import { defaultImages, getRandomNumber } from "../store/storeUtils";

type GoogleData = {
  id?: string;
  title?: string;
  subTitle?: string;
  authors?: string[];
  description?: string;
  publisher?: string;
  publishedDate?: string;
  pageCount?: string;
  categories?: string[];
  imageURL?: string;
  bookDetailsURL?: string;
  isbn?: { type: string; identifier: string }[];
  googleISBNS?: Record<string, string>;
  query?: string;
  queryDateString?: string;
};
type BookInfo = {
  summary?: string;
  length?: string;
  title?: string;
  author?: string;
  narratedBy?: string;
  releaseDate?: string;
  otherCategories?: string[];
  stopFlag?: boolean;
};
export type FolderMetadata = {
  id: string;
  folderName: string;
  fullPath: string;
  audioFileCount: number;
  textFileCount: number;
  dirCount: number;
  infoFileData: BookInfo;
  folderImages: string[];
  folderNameData: {
    title: string;
    publishedYear: string;
    author: string;
    category: string;
  };
  googleAPIData: GoogleData;
  mongoDBId: string | undefined;
  forceMongoUpdate?: boolean | undefined;
};
export type CleanBookMetadata = ReturnType<typeof cleanOneBook>;
export function cleanOneBook(
  book: FolderMetadata,
  path_lower: string,
  localImageName?: string
) {
  if (!book) return undefined;
  // decide on data for fields that come from multiple sources
  // if infoFileData available use it for the following:
  const googleAuthor = book?.googleAPIData?.authors
    ? book.googleAPIData.authors[0]
    : undefined;
  const author =
    book?.infoFileData?.author || book?.folderNameData?.author || googleAuthor;

  const title =
    book?.infoFileData?.title ||
    book?.folderNameData?.title ||
    `${book?.googleAPIData?.title}: ${book?.googleAPIData?.subTitle}`;
  const description =
    book?.infoFileData?.summary || book?.googleAPIData?.description;
  const publishedYear =
    parseInt(book?.folderNameData?.publishedYear) ||
    parseInt(book?.googleAPIData?.publishedDate?.slice(0, 4));
  const releaseDate =
    book?.infoFileData?.releaseDate || book?.googleAPIData?.publishedDate;
  const imageURL = book?.googleAPIData?.imageURL; // || book.folderImages[0];
  // const imageURL = book?.googleAPIData?.imageURL || defaultImages.image01; // || book.folderImages[0];
  // Concate all categories together and filter out blanks (we remove dups when assigning to object)
  const categories = [
    book?.folderNameData?.category,
    ...(book?.googleAPIData?.categories || []),
    ...(book?.infoFileData?.otherCategories || []),
  ].filter((el) => el);

  const bookLength = book?.infoFileData?.length;
  const randomNum = getRandomNumber();
  const [categoryOne, categoryTwo] = getCategoriesFromPath(path_lower);

  return {
    id: book.id,
    dropboxPathLower: path_lower,
    fullPath: book.fullPath,
    audioFileCount: book.audioFileCount,
    title,
    description,
    author,
    authors: book?.googleAPIData?.authors,
    narratedBy: book?.infoFileData?.narratedBy,
    publishedYear,
    releaseDate,
    publisher: book?.googleAPIData?.publisher,
    pageCount: parseInt(book?.googleAPIData?.pageCount) || undefined,
    bookLength,
    imageURL: imageURL ? { uri: imageURL } : undefined,
    defaultImage: defaultImages[`image${randomNum}`],
    localImageName: localImageName,
    categories: Array.from(new Set(categories)),
    categoryOne,
    categoryTwo,
  };
}

function getCategoriesFromPath(pathIn: string) {
  // Final output var
  let categoryOne = "";
  let categoryTwo = "";

  // Split path into pieces
  const pathArr = pathIn.split("/");
  // Get rid of bookname
  pathArr.pop();
  const lastItem = pathArr[pathArr.length - 1];
  //Regex to check if "A-N", "N-Z" etc.
  const regEx = /^[a-zA-Z]\s*?-\s*?[a-zA-Z]$/; // /a-z\s*-.*$/

  if (regEx.test(lastItem)) {
    categoryOne = pathArr[pathArr.length - 3];
    categoryTwo = pathArr[pathArr.length - 2];
  } else {
    categoryOne = pathArr[pathArr.length - 2];
    categoryTwo = pathArr[pathArr.length - 1];
  }

  return [categoryOne, categoryTwo];
}
