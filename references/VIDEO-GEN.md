# Creating a video generation task
POST https://ark.ap-southeast.bytepluses.com/api/v3/contents/generations/tasks 
Try 
This topic describes the request and response parameters of the API operation for creating a video generation task. You can refer to this topic for the meaning of a parameter when you call this API operation. After the specified model generates a video based on the input image and text information, you can query the video generation task by condition and obtain the generated video.
*The video generation capabilities supported by different models are as follows:
*Seedance 1.5 pronew Video with Audio (Configurable)
*Image-to-Video-First Frame and Last Frame: Generate the target video based on your first-frame image +  last-frame image + text prompt (optional) + parameters (optional). 
*Image-to-Video-First Frame: Generate the target video based on your first-frame image + text prompt (optional) + parameters (optional).
*Text-to-Video: Generate the target video based on your text prompt + parameters (optional).
*Seedance 1.0 pro
*Image-to-Video-First Frame and Last Frame: Generate the target video based on your first-frame image +  last-frame image + text prompt (optional) + parameters (optional). 
*Image-to-Video-First Frame: Generate the target video based on your first-frame image + text prompt (optional) + parameters (optional).
*Text-to-Video: Generate the target video based on your text prompt + parameters (optional).
*seedance-pro-fast
*Image-to-Video-First Frame: Generate the target video based on your first-frame image + text prompt (optional) + parameters (optional).
*Text-to-Video: Generate the target video based on your text prompt + parameters (optional).
*Seedance 1.0 lite
*seedance-1-0-lite-t2v： Text-to-Video. Generate the target video based on your text prompt + parameters (optional).
*seedance-1-0-lite-i2v：Image-to-Video. 
*Image-to-Video-Reference Images: Generate the target video based on your reference images（1-4 images） + text prompt (optional) + parameters (optional).
*Image-to-Video-First Frame and Last Frame: Generate the target video based on your first-frame image +  last-frame image + text prompt (optional) + parameters (optional). 
*Image-to-Video-First Frame: Generate the target video based on your first-frame image + text prompt (optional) + parameters (optional).

The video generation capabilities supported by different models are as follows:

Try
Quick start
Authentication
  Experience Center   Model List  Model Billing  API Key
  API Call Guide   API Reference  FAQs  Model Activation
This interface only supports API Key authentication. Please obtain a long-term API Key on the  API Key management page.

API Explorer
You can initiate calls online through API Explorer without paying attention to the signature generation process and quickly obtain the call results.
Go to debug

Request parameters
Jump to Response parameters

Request body
model string Required
The ID of the model that you want to call. You can activate a model service and query the model ID.
You can also use an endpoint ID to call a model, querying its rate limits, billing method (prepaid or postpaid), and status, and using its advanced capabilities such as monitoring and security. For more information, refer to Obtaining an endpoint ID.

content object[] Required
The input text and image information for the model to generate a video.
*Attributes
* 
*content.type string Required
*The type of the input content. In this case, set the value to text.
* 
*content.text string Required
*The input text information for the model, which describes the video to be generated. The content includes:
*Text prompt (required): You can use Chinese and English characters. For tips on using prompts, please refer to Guide to Seedance Prompts.
*Parameters (optional): You can add --[parameters] after the text prompt to control the specifications of the output video. For more information, refer to Text commands for models (optional).
*Image-to-Video-First Frame:
*Supported models：Seedance 1.5 pro、Seedance 1.0 pro、Seedance 1.0 pro fast、Seedance 1.0 lite i2v 
*The value for the role：One image_url object must be provided. The role is optional. If provided, the value must be first_frame
*Image-to-Video-First and Last Frames
*Supported model：Seedance 1.5 pro、Seedance 1.0 pro、Seedance 1.0 lite i2v 
*The value for the role：Two image_url objects must be provided.The role is required.
*The first image must have role set to first_frame
*The second image must have role set to last_frame
*Instructions
*The first and last frame images provided can be the same. If the aspect ratios of the first and last frame images differ, the first frame image will be used as the reference, and the last frame image will be automatically cropped to match.
*Image-to-Video - Reference Images
*Supported model：seedance-1-0-lite-i2v
*The value for the role：One to four image_url objects must be provided. The role is required.
*The role value for each reference image must be reference_image.
*Instructions
*For reference image-based video generation, text prompts can be written in natural language to specify combinations of multiple images. However, for better instruction adherence, it is recommended to use the format: [Image 1]xxx, [Image 2]xxx to explicitly reference each image.
*Ex. 1
*A boy wearing glasses and a blue T-shirt and a corgi dog, sitting on the lawn, in 3D cartoon style.
*Ex. 2 
*A boy wearing glasses and a blue T-shirt from [Image 1] and a corgi dog from [Image 2], sitting on the lawn from [Image 3], in 3D cartoon style

Information type

Text information object
The input text information for the model to generate a video.
Attributes

Image information object
The input image information for the model to generate a video.
Attributes

content.type string Required
The type of the input content. In this case, set the value to image_url. Supports image URL or image Base64 encoding.

content.image_url object Required
The input image object for the model.
Attributes
content.image_url.url string Required
The image information, which can be an image URL or the Base64-encoded content of an image.
Image URL: Make sure that the image URL is accessible.
Base64-encoded content: The format must be data:image/<image format>;base64,<Base64-encoded content of the image>,  noting that <image format> should be in lowercase, such as data:image/png;base64,<Base64-encoded content of the image
Instructions
An input image must meet the following requirements:
It must be in one of the following formats: JPEG, PNG, WebP, BMP, TIFF, GIF.  For Seedance 1.5 Pro, HEIC and HEIF formats are newly supported.
Its aspect ratio must be in the range of 0.4 to 2.5.
Its shorter side must be greater than 300 pixels, and its longer side must be less than 6,000 pixels.
It must be smaller than 30 MB in size.

content.role string Required under certain conditions
The location or purpose of the image. Valid values:
warning
Image-to-Video-First Frame, Image-to-Video-First and Last Frames and Image-to-Video-Reference Images are three mutually exclusive scenarios, and mixed use is not supported.
Image-to-Video-First Frame

Image-to-Video-First and Last Frames

Image-to-Video - Reference Images

callback_url string
Please fill in the callback notification address for the result of this generation task. When there is a status change in the video generation task, Ark will send a callback request containing the latest task status to this address.
The content structure of the callback request is consistent with the response body of Querying the information about a video generation task.
The status returned by the callback includes the following states:
queued: In the queue.
running: The task is running.
succeeded: The task is successful. (If the sending fails, that is, the information of successful sending is not received within 5 seconds, the callback will be made three times)
failed: The task fails. (If the sending fails, that is, the information of successful sending is not received within 5 seconds, the callback will be made three times)
expirednew：The task has timed out. This occurs when the task has remained in the running or queued status for longer than the allowed expiration duration. The expiration duration can be set via the execution_expires_after field.

return_last_frame Boolean Default value: false
true：Returns the last frame image of the generated video. After setting this parameter to true, you can obtain the last frame image by calling the Querying the information about a video generation task. The last frame image is in PNG format, with its pixel width and height consistent with those of the generated video, and it contains no watermarks. 
Using this parameter allows the generation of multiple consecutive videos: the last frame of the previously generated video is used as the first frame of the next video task, enabling quick generation of multiple consecutive videos. For specific calling examples, please refer to the tutorial.
false：Does not return the last frame image of the generated video.

service_tiernew string Default value: default
Modification to the service tier of submitted tasks is not supported.
Specifies the service tier for processing the current request.
default: Online inference mode. This tier has lower RPM and concurrency quotas (see Model List), suitable for latency-sensitive inference scenarios.
flex: Offline inference mode. This tier provides a higher TPD quota (see Model List) at 50% of the price of the online inference tier, suitable for scenarios where low inference latency is not a critical requirement.

execution_expires_afternew integer Default value: 172800
The task expiration threshold. Specifies the time (in seconds) after which a submitted task will expire, calculated from its created_at timestamp.
Default: 172800 seconds (48 hours)
Valid Range: [3600，259200]
Regardless of the chosen service_tier, it is recommended to set an appropriate value based on your business scenario. Tasks exceeding the threshold will be automatically terminated and marked as expired.

generate_audionew boolean 默认值 true
Only supported by Seedance 1.5 pro
Controls whether the generated video includes audio synchronized with the visuals.
true: The model outputs a video with synchronized audio. Seedance 1.5 pro can automatically generate matching voice, sound effects, or background music based on the prompt and visual content. It is recommended to enclose dialogue in double quotes. Example: A man stops a woman and says, "Remember, never point your finger at the moon."
false: The model outputs a silent video.

Text commands for models (optional) 
You can add --[parameters] after the text prompt to control the specifications of the output video, such as its aspect ratio, frame rate, and resolution.
The parameters and values supported are model-dependent. Please consult the Model Text Command Comparison for specific compatibilities. Inputs that do not adhere to the selected model's specifications will be either ignored or result in an error.
Example

JSON
Copy
//Specify the aspect ratio of the generated video as 16:9, duration as 5 seconds, frame rate as 24 fps, resolution as 720p, and include a watermark. The camera is not fixed.

"content": [
        {
            "type": "text",
            "text": "A woman in a green sequin dress stands in front of a pink background, with colorful confetti falling around her. --rt 16:9 --dur 5 --fps 24 --rs 720p --wm true --cf false"
        }
    ]

resolution string Abbreviation: rs
For Seedance 1.5 pro、Seedance 1.0 lite，the default value is 720p.
For Seedance 1.0 pro&pro-fast，the default value is 1080p.
The resolution of the output video. Valid values:
480p
720p
1080p: Seedance 1.5 pro and Reference image feature are not supported
The acceptable values are model-dependent. Please consult the Model Text Command Comparison for specifics

ratio string Abbreviation: rt
Text-to-Video generally defaults to 16:9.
Image-to-Video generally defaults to adaptive. The default for video generation from reference images is 16:9.
For Seedance 1.5 pro, the default aspect ratio is adaptive.
The aspect ratio of the output video. Valid values:
16:9
4:3
1:1
3:4
9:16
21:9
adaptive: The optimal aspect ratio is automatically selected based on the uploaded image.
warning
For Seedance 1.5 pro’s text-to-video feature, setting the aspect ratio to adaptive means the model will intelligently select the most suitable dimensions based on your input prompt.
The actual aspect ratio of the generated video can be obtained from the ratio field returned by the Retrieve a video generation task API.
Corresponding Width and Height Pixel Values for Different Aspect Ratios
Note: When generating a video from an image, if the selected aspect ratio is inconsistent with that of the uploaded image, Ark will crop your image. The cropping will be centered. For detailed rules, please refer to the Image Cropping Rules.

resolution

ratio

Pixel Values (width × height)
Seedance 1.0 Series

Pixel Values (width × height)
Seedance 1.5 pro

480p

16:9

864×480

864×496

4:3

736×544

752×560

1:1

640×640

640×640

3:4

544×736

560×752

9:16

480×864

496×864

21:9

960×416

992×432

720p

16:9

1248×704

1280×720

4:3

1120×832

1112×834

1:1

960×960

960×960

3:4

832×1120

834×1112

9:16

704×1248

720×1280

21:9

1504×640

1470×630

1080p 
Seedance 1.5 pro: Not supported. Seedance 1.0 lite: Does not support reference image generation.

16:9

1920×1088

-

4:3

1664×1248

-

1:1

1440×1440

-

3:4

1248×1664

-

9:16

1088×1920

-

21:9

2176×928

-

duration integer Default value: 5 Abbreviation: dur
Choose either duration or frames; frames takes priority over duration. If you want to generate a video of an integer number of seconds, it is recommended to specify duration.
The duration of the output video. Unit: seconds. 
Value range: 2~12 snew
warning
Seedance 1.5 pro supports two methods for configuring video duration:
Specify a fixed duration: You may set any integer value within the range [4, 12] (in seconds).
Let the model decide: Set the duration to -1, and the model will autonomously select an appropriate video length (in whole seconds) within the [4, 12] range. The actual generated video duration can be obtained from the duration field returned by the  Retrieve a video generation task API. Please note that video duration is related to billing, so configure this setting carefully.

framesnew Integer Abbreviation: frames
Seedance 1.5 pro is not supported.
Choose either duration or frames; frames takes priority over duration. If you want to generate a video with a fractional second duration, it is recommended to specify frames.
Number of frames for the output video. By specifying the number of frames, you can flexibly control the length of the generated video, including videos with fractional second durations. Due to the value constraints of frames, only a limited number of fractional second durations are supported. You need to calculate the closest number of frames using the formula. 
Calculation formula: Number of Frames = Duration × Frame Rate (24).
Value range: Supports all integer values within the range [29, 289] that conform to the format 25 + 4n, where n is a positive integer.
For example: If you want to generate a 2.4-second video, the number of frames would be 2.4 × 24 = 57.6. Since 57.6 is not a valid value for frames, you must select the closest valid value. Calculated using the formula 25 + 4n, the closest valid number of frames is 57, and the actual duration of the generated video will be 57 / 24 = 2.375 seconds.

framepersecond  integer Default value: 24 Abbreviation: fps
The frame rate of the output video, which specifies the number of images displayed in the video per second. Valid values:
24

seed integer Default value: -1 Abbreviation: seed
The seed, which is an integer that controls the randomness of the output content. Valid values: integers within the range of [-1, 2^32-1].
warning
If the seed parameter is not specified or is set to -1, a random number is used.
Changing the seed value is a way to obtain different outputs for the same request. Using the same seed value for the same request generates similar but not necessarily identical outputs.

camerafixed boolean Default value: false Abbreviation: cf
The reference-image-to-video is not supported
Specifies whether to fix the camera. Valid values:
true: fixes the camera. The platform appends an instruction to fix the camera to your prompt, but does not guarantee the actual effect.
false: does not fix the camera.

watermark boolean Default value: false Abbreviation: wm
Specifies whether to add watermarks to the output video. Valid values:
false: does not add watermarks.
true: adds watermarks.

Response parameters
Jump to Request parameters
id string
The ID of the video generation task. Creating a video generation task is an asynchronous interface. After obtaining the ID, you need to query the status of the video generation task through Querying the information about a video generation task. When the task is successful, the video_url of the generated video will be output.


---

# Retrieve a Video Generation Task
GET https://ark.ap-southeast.bytepluses.com/api/v3/contents/generations/tasks/{id} Try
Retrieves the information of a video generation task.

Try
Authentication
Quick Start
This interface only supports API Key authentication. Obtain a long-term API Key on the  API Key management page.
  Experience Center Model List Model Billing API Key
  API Call Guide API Reference FAQs Model Activation

API Explorer
You can initiate calls online through API Explorer without paying attention to the signature generation process and quickly obtain the call results.
Go to debug

Request parameters
See Response parameters

Path parameters
id string required
The ID of the video generation task to query.

Response parameters
See Request parameters

id string
The ID of the video generation task.

model string
The name and version of the model used by the task (Model name-Version)

status string
The status of the task. Valid values:
queued
running
cancelled (Only tasks in the queued state can be canceled)
succeeded
failed
expirednew

error object / null
The error information. If the task succeeds, null is returned. If the task fails, the error information is returned. For more information, refer to Error codes.
Attributes

error.code string
The error code.

error.message string
The error message.

created_at integer
The time when the task was created. The value is a Unix timestamp in seconds.

updated_at integer
The time when the task was last updated. The value is a Unix timestamp in seconds.

content object
The output after the video generation task is completed.
Attributes

content.video_url string
The URL of the output video. For security purposes, the output video is deleted after 24 hours. Be sure to save it in time.

content.last_frame_url string
URL of the last frame of the generated video. Valid for 24 hours. Be sure to save it in time.
Note：If you set "return_last_frame": true in the creating a video generation task request, the parameter will be returned.

seed integer
The seed value (integer) used for this request.

resolution  string 
The resolution of the generated video.

ratio string
The width-to-height ratio of the generated video.

duration integer 
The length of the generated video in seconds.
Notenew: Only one of the duration and frames parameters is returned. If frames is not specified in the creating video generation request, duration will be returned.

framesnew integer  
Number of frames for the generated video.
Note: Only one of the duration and frames parameters will be returned. If frames is specified in the creating video generation request, frames will be returned.

framespersecond  integer 
The frame rate of the generated video.

generate_audionew boolean
Specifies whether the generated video includes audio synchronized with the visuals. This parameter is only supported by Seedance 1.5 pro.
true: The model outputs a video with synchronized audio.
false: The model outputs a silent video.

service_tier newstring
The service tier actually used to process the task.

execution_expires_afternew integer
The expiration threshold for the task, in seconds.

usage object
The token usage for the request.
Attributes

usage.completion_tokens integer
The number of tokens consumed for the video output by the model.

usage.total_tokens integer
Total tokens for this request. For video models, input tokens are always 0, therefore total_tokens = completion_tokens.

---

# List Video Generation Tasks
GET https://ark.ap-southeast.bytepluses.com/api/v3/contents/generations/tasks?page_num={page_num}&page_size={page_size}&filter.status={filter.status}&filter.task_ids={filter.task_ids}&filter.model={filter.model}    Try
You can specify the filter parameters to retrieve a list of tasks. 
Instructions
Only the historical data from the past 7 days can be queried. Time calculation is based on UTC timestamps. The 7-day range is determined using the exact moment (to the second) when the batch query request is made, with the time window defined as [T − 7 days, T).

Quick start
Authentication
This interface only supports API Key authentication. Obtain a long-term API Key on the  API Key management page.

Experience Center
Model List
Model Billing
API Key

API Call Guide
API Reference
FAQs
Model Activation

Request parameters
See Response parameters

Query parameters

page_num integer / null 
The page number of the returned results.
Valid values: [1, 500]

page_size integer / null
The number of entries per page.
Valid values: [1, 500]

filter.status string / null
The status of the task. Valid values:
queued
running
cancelled (Only tasks in the queued state can be canceled)
succeeded
failed

filter.task_ids string[] / null
Search for specific video generation tasks using the task ID. Multiple IDs can be passed, separated with &.
Example：filter.task_ids=id1&filter.task_ids=id2.

filter.model string / null
The ID of the used inference endpoint for the exact search, which differs from the model parameter in the response.

filter.service_tiernew string / null Default value: default
The service tier to process tasks.
default: Online inference mode.
flex: Offline inference mode.
Response parameters
See Request parameters

items object[]
The retrieved video generation tasks.
Attributes

items.id string
The ID of the video generation task.

items.model string
The name and version of the model used by the task (Model name-Version).

items.status string
The state of the task. Valid values:
queued
running
cancelled (The task has been canceled. Only tasks in the queued state can be canceled.)
succeeded
failed
expirednew

items.error object / null
The error information. If the task succeeds, null is returned. If the task fails, the error information is returned. For more information, refer to Error codes.
Attributes

error.code string
The error code.

error.message string
The error message.

items.created_at integer
The time when the task was created. The value is a UNIX timestamp in seconds.

items.updated_at integer
The time when the task was last updated. The value is a UNIX timestamp in seconds.

items.content object
The output of the video generation task. It contains the download URL of the output video.
Attributes

content.video_url string
The URL of the output video. For security purposes, the output video is cleared after 24 hours. Save it in time.

content.last_frame_url string
URL of the Video's last frame. Valid for 24 hours. Be sure to save it in time.
Note：When setting "return_last_frame": true in the creating a video generation task request, the parameter will be returned.

items.seed integer
The integer value used for this generation task.

items.resolution  string 
The resolution of the generated video.

items.ratio string
The width-to-height ratio of the generated video.

items.duration integer 
The length of the generated video in seconds.
Notenew: Only one of the duration and frames parameters will be returned. If frames is not specified when creating a video generation task, duration will be returned.

items.framesnew integer  
The number of frames of the generated video.
Note: Only one of the duration and frames parameters will be returned. If frames is specified when creating a video generation, frames will be returned.

items.framespersecond  integer 
The frame rate of the generated video.

items.generate_audionew boolean
Specifies whether the generated video includes audio synchronized with the visuals. This parameter is only supported by Seedance 1.5 pro.
true: The model outputs a video with synchronized audio.
false: The model outputs a silent video.

items.service_tier newstring
The actual service tier used to process the task.

items.execution_expires_afternew integer
The expiration threshold for the task, in seconds.

items.usage object
The token usage for the request.
Attributes

usage.completion_tokens integer
The number of tokens consumed for the video output by the model.

usage.total_tokensinteger
Total tokens for this request. For video models, input tokens are always 0, therefore total_tokens = completion_tokens.

total integer
The number of tasks that match the filter conditions.

---

# Cancel or delete a video generation task
DELETE https://ark.ap-southeast.bytepluses.com/api/v3/contents/generations/tasks/{id}  Try  
Cancels a queued video generation task, or deletes a video generation task record.

Try
Authentication
Quick start
This interface only supports API Key authentication. Obtain a long-term API Key on the  API Key management page.
  Experience Center Model List Model Billing API Key
  API Call Guide API Reference FAQs Model Activation

API Explorer
You can initiate calls online through API Explorer without paying attention to the signature generation process and quickly obtain the call results.
Go to debug

Request parameters
See Response parameters

Path parameters
id string required
The ID of the video generation task to be canceled or deleted.
The operation performed by the DELETE API varies depending on the status of the video generation task:

Task Status

Can it be deleted?

Operation Description

Post-DELETE Task Status

queued 

Yes

The task is removed from the queue and its status is updated to 'cancelled'.

cancelled 

running 

No

-

-

succeeded 

Yes

The video generation task record is deleted and will no longer be queryable.

-

failed 

Yes

The video generation task record is deleted and will no longer be queryable.

-

cancelled 

No

-

-

expired

Yes

The video generation task record is deleted and will no longer be queryable.

-

Response parameters
See Request parameters
This API operation has no response parameters.
