//Making the class below reusable
//We mainly focus on queryString
class APIFeatures {
  constructor(query, queryString) {
    this.query = query; //what ever is returned from the bellow methods comes back to this
    this.queryString = queryString; //what ever is returned from the bellow methods comes back to this
    //this. keyword prevents the class from being bound to the Tour
    //this function gets automatically called whnenever we craet an object out of this class
  }

  filter() {
    const queryObj = { ...this.queryString }; //Contains the searched query
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach((el) => delete queryObj[el]);

    // 1B) Advanced filtering
    let queryStr = JSON.stringify(queryObj); //converting the query object into a string
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`); //Automatically includes the $

    this.query = this.query.find(JSON.parse(queryStr)); //Brings in the find method

    return this;
  }

  sort() {
    if (this.queryString.sort) {
      //if the query input is sort
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('-createdAt'); //Default
    }

    return this;
  }

  limitFields() {
    if (this.queryString.fields) {
      //What you search for eg field=name,duration thta is the this.queryString
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v'); //Default
    }

    return this;
  }

  paginate() {
    const page = this.queryString.page * 1 || 1; //this makes also the deafault page to be 1
    const limit = this.queryString.limit * 1 || 100; //default maximum page content is 100
    const skip = (page - 1) * limit; //how much to skio to go to that page

    this.query = this.query.skip(skip).limit(limit);

    return this;
  }
}
module.exports = APIFeatures;
