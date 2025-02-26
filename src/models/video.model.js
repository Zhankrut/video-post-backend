import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
 // this is used to paginate the videos and write aggregation queries
 // what is paginate?
 // Pagination refers to the process of dividing a large dataset or list of items into smaller, more manageable chunks or "pages" rather than displaying all the data at once. 
 // what is aggregation queries? 
 // the aggregation queries are used to process data records and return computed results. Aggregation operations group values from multiple documents together, and can perform a variety of operations on the grouped data to return a single result.

const videoSchema = new mongoose.Schema({
    videoFile: {
        type: String, // cloudinary url
        required: true,
    },
    thumbnail: {
        type: String, // cloudinary url
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    duration: {
        type: Number, // cloudinary url
        required: true,
    },
    views: {
        type: Number,
        default: 0,
    },
    isPublished:{
        type: Boolean, 
        default: false,
    },
    owner:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    }
    
}, { timestamps: true });

videoSchema.plugin(mongooseAggregatePaginate);

export const Video = mongoose.model("Video", videoSchema);