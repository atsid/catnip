ATS Hack Day project - Lunch?
=====================

A hybrid mobile application using Cordova, Kendo UI, and Telerik Backend serivces.  Compiles to Android and iOS.

This project solves the problem that has plagued businesses almost since the origin of shared office space:
"What do you want to have for lunch?"  "I don't know.  What do you want for lunch?" ;-)

Challenges:
* Coordinating schedules that change daily.
* Coordinating different food preferences.
* Coordinating people who bring their lunch vs buy lunch.
* (Taking into account who does and does not want to eat with whom.)

Approach:
* Input your schedule each day, when your meetings finish, and you're available lunch.
* Enter when you have to be back by.
* Select one or more categories of food.
* Alternatively specificy if you brought your lunch, or if you are unavailble for lunch that day.

Results:
* Software will calculate and display the overlaps in schedules and types of food.
* Software will send a push notification each day if you have not entered your food preferences for the day.
* (You may turn off push notifications for that day just by opening the app - this action will auto-mark you as out for the day.)
* In our case, people buying would bring their food back and sit down at a table with those who brought lunch to work.  The scheduler helped those who brought to coordinate with the return times of those who went out.

Chat:
The software also provides an in-app chat.  Messages are only sent to those who have specified that they are in for lunch that day.  Allows participants to move from time & food type, to coordinating (across floors) to actually gather and leave the building.

Discoveries:
* Weather trumps all: If it's raining or snowing, people will just go to the closest restaurant.
* For some reason, momentum to use the app can not be accomplished with only one person, but if two people commit to using the app every day, that's enough to tip the scales and everyone will start using the app.

Notes:
* User accounts were manually created for this product, to control the size of the beta pool.  There is no automatic signup feature.  There was a planned invite feature, but that was never developed.
