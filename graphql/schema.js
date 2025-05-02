const {
  GraphQLObjectType, GraphQLString, GraphQLFloat, GraphQLSchema, GraphQLID, GraphQLList,
  GraphQLInputObjectType, GraphQLInt, GraphQLNonNull, GraphQLEnumType
} = require('graphql');
const Product = require('../models/Product');

const ProductType = new GraphQLObjectType({
  name: 'Product',
  fields: () => ({
    id: { type: GraphQLID },
    name: { type: new GraphQLNonNull(GraphQLString) },
    description: { type: GraphQLString },
    price: { type: new GraphQLNonNull(GraphQLFloat) },
    category: { type: new GraphQLNonNull(GraphQLString) },
    brand: { type: GraphQLString },
    rating: { type: GraphQLFloat },
    createdAt: { type: GraphQLString },
    updatedAt: { type: GraphQLString },
  })
});

const ProductInput = new GraphQLInputObjectType({
  name: 'ProductInput',
  fields: {
    name: { type: new GraphQLNonNull(GraphQLString) },
    description: { type: GraphQLString },
    price: { type: new GraphQLNonNull(GraphQLFloat) },
    category: { type: new GraphQLNonNull(GraphQLString) },
    brand: { type: GraphQLString },
    rating: { type: GraphQLFloat },
  }
});

const ProductUpdateInput = new GraphQLInputObjectType({
  name: 'ProductUpdateInput',
  fields: {
    name: { type: GraphQLString },
    description: { type: GraphQLString },
    price: { type: GraphQLFloat },
    category: { type: GraphQLString },
    brand: { type: GraphQLString },
    rating: { type: GraphQLFloat },
  }
});

const ProductFilter = new GraphQLInputObjectType({
  name: 'ProductFilter',
  fields: {
    name: { type: GraphQLString },
    category: { type: GraphQLString },
    brand: { type: GraphQLString },
    minPrice: { type: GraphQLFloat },
    maxPrice: { type: GraphQLFloat },
  }
});

const SortOrder = new GraphQLEnumType({
  name: 'SortOrder',
  values: { ASC: { value: 1 }, DESC: { value: -1 } }
});

const ProductSort = new GraphQLInputObjectType({
  name: 'ProductSort',
  fields: {
    field: { type: GraphQLString },
    order: { type: SortOrder }
  }
});

const RootQuery = new GraphQLObjectType({
  name: 'RootQueryType',
  fields: {
    getProduct: {
      type: ProductType,
      args: { id: { type: GraphQLID } },
      resolve: (_, { id }) => Product.findById(id)
    },
    listProducts: {
      type: new GraphQLList(ProductType),
      args: {
        filter: { type: ProductFilter },
        sort: { type: ProductSort },
        limit: { type: GraphQLInt },
        offset: { type: GraphQLInt },
      },
      resolve: async (_, { filter, sort, limit = 10, offset = 0 }) => {
        const query = {};
        if (filter) {
          if (filter.name) query.name = new RegExp(filter.name, 'i');
          if (filter.category) query.category = filter.category;
          if (filter.brand) query.brand = filter.brand;
          if (filter.minPrice || filter.maxPrice) {
            query.price = {};
            if (filter.minPrice) query.price.$gte = filter.minPrice;
            if (filter.maxPrice) query.price.$lte = filter.maxPrice;
          }
        }

        const sortQuery = {};
        if (sort) sortQuery[sort.field] = sort.order;

        return await Product.find(query).sort(sortQuery).skip(offset).limit(limit);
      }
    }
  }
});

const Mutation = new GraphQLObjectType({
  name: 'Mutation',
  fields: {
    createProduct: {
      type: ProductType,
      args: { input: { type: ProductInput } },
      resolve: (_, { input }) => Product.create(input)
    },
    updateProduct: {
      type: ProductType,
      args: {
        id: { type: GraphQLID },
        input: { type: ProductUpdateInput }
      },
      resolve: (_, { id, input }) => Product.findByIdAndUpdate(id, input, { new: true })
    },
    deleteProduct: {
      type: GraphQLString,
      args: { id: { type: GraphQLID } },
      resolve: async (_, { id }) => {
        const result = await Product.findByIdAndDelete(id);
        return result ? 'Deleted' : 'Not found';
      }
    }
  }
});

module.exports = new GraphQLSchema({
  query: RootQuery,
  mutation: Mutation
});