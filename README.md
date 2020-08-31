# Import NJ511 Traffic Times to to Microprediction

This module imports the traffic driving times for various NJ roads, tunnels
and bridges to Microprediction.org

## Data Source

The data is sourced from various urls from NJ511.org

## Implementation Details

There is a single Lambda function that is run as a scheduled
CloudWatch Event every 3 minutes to pull new data. This function
is created using webpack to amalgamate the various imported modules.

It runs in about 4 seconds or less.

The write keys are not included in this repo.
